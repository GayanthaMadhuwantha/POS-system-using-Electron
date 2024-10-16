const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const printer = require('pdf-to-printer');
const PDFDocument = require('pdfkit');

let db; // Declare the global db variable

function createWindow() {
  const win = new BrowserWindow({
    width:1380,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // To ensure security
      enableRemoteModule: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Initialize the database connection when the app is ready
  db = new sqlite3.Database('./restaurant.db', (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the restaurant database.');
    }
  });

  createWindow();
});

ipcMain.handle('get-items', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});


ipcMain.handle('save-order', async (event, orderDetails) => {


  return new Promise((resolve, reject) => {
    const { items, totalPrice, cashAmount, balance, date } = orderDetails;

    // Debug: Log the received values to ensure they are correct
    console.log('Received orderDetails:', { items, totalPrice, cashAmount, balance, date });

    // Check if totalPrice is valid
    if (totalPrice == null || isNaN(totalPrice) || totalPrice <= 0) {
      db.close();
      return reject(new Error('Invalid totalPrice value.'));
    }

    // Insert into the orders table
    db.run(
      'INSERT INTO orders (total, cash, balance, order_time) VALUES (?, ?, ?, ?)',

      [totalPrice, cashAmount, balance, date],
      function (err) {
        if (err) {
          db.close();
          return reject(new Error('Failed to save order: ' + err.message));
        }

        const orderId = this.lastID; // Get the ID of the inserted order

        // Insert into the order_details table
        const insertDetails = db.prepare('INSERT INTO order_details (id, item_name, price, quantity) VALUES (?, ?, ?, ?)');

        for (const item of items) {
          insertDetails.run(orderId,item.name, item.price, item.quantity,(err) => {
            if (err) {
              db.close();
              return reject(new Error('Failed to save order details: ' + err.message));
            }
          });
        }

        insertDetails.finalize((err) => {
          if (err) {
            db.close();
            return reject(new Error('Failed to finalize order details insertion: ' + err.message));
          }

          db.close(); // Close the database connection
          resolve(true); // Order and details saved successfully
        });
      }
    );
  });
});


ipcMain.handle('get-orders', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT o.id, o.total, o.cash, o.balance, o.order_time, d.item, d.quantity FROM orders o inner join order_details d on o.id=d.id', [], (err, rows) => {
      if (err) {
        reject('Failed to retrieve orders: ' + err.message);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('get-orders-by-date', async (event, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM orders WHERE order_time BETWEEN ? AND ?`;
    const params = [`${startDate}T00:00:00`, `${endDate}T23:59:59`];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        reject('Failed to retrieve orders: ' + err.message);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('login', async (event, username, password) => {
  const adminUsername = 'admin';  // Replace with actual username
  const adminPassword = 'password123';  // Replace with actual password (hash this in production)

  return username === adminUsername && password === adminPassword;
});

ipcMain.handle('add-food-item', async (event, name, price) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO food_items (name, price) VALUES (?, ?)', [name, price], function(err) {
      if (err) {
        reject('Failed to add item: ' + err.message);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('add-supplier', async (event, newSupplierName, newMobile, newAddress) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO suppliers(supplier_name, mobile_number, address) VALUES (?, ?, ?)', [newSupplierName, newMobile, newAddress], function(err) {
      if (err) {
        reject('Failed to add Supplier ' + err.message);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('get-supplier', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM suppliers`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('remove-supplier', async (event, supplierId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM suppliers WHERE id = ?', [supplierId], function(err) {
      if (err) {
        reject('Failed to remove Supplier ' + err.message);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('update-supplier', async (event, supplierId, newSupplierName, newMobile, newAddress) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE suppliers SET supplier_name = ?, mobile_number = ?, address = ? WHERE id = ?', 
      [newSupplierName, newMobile, newAddress, supplierId], function(err) {
      if (err) {
        reject('Failed to update Supplier ' + err.message);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('add-product', async (event, newSupplierName, categorynameName, productname, productcount, stockprice, wholesaleprice, discount) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO produts (supplier_name, product_name, quantity, stock_price, wholesale_price, discount) VALUES (?, ?, ?, ?, ?, ?, ?)', [newSupplierName, productname, categorynameName, productcount, stockprice, wholesaleprice, discount], function(err) {
      if (err) {
        reject('Failed to add Product  ' + err.message);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('remove-food-item', async (event, name) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM food_items WHERE name = ?', [name], function(err) {
      if (err) {
        reject('Failed to remove item: ' + err.message);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('update-food-item-price', async (event, name, price) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE food_items SET price = ? WHERE name = ?', [price, name], function(err) {
      if (err) {
        reject('Failed to update price: ' + err.message);
      } else {
        resolve(true);
      }
    });
  });
});

ipcMain.handle('remove-order', async (event, orderId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
      if (err) {
        reject(new Error('Failed to check order existence: ' + err.message));
      } else if (!row) {
        resolve(false); 
      } else {
        db.run('DELETE FROM orders WHERE id = ?', [orderId], function (err) {
          if (err) {
            reject(new Error('Failed to remove order: ' + err.message));
          } else {
            resolve(true); 
          }
        });
      }
    });
  });
});

ipcMain.handle('generate-print-receipt', async (event, orderDetails) => {
  try {
    await generateAndPrintReceipt(orderDetails);
    console.log('Receipt printed successfully');
    return true; // Return a successful result
  } catch (error) {
    console.error('Error printing receipt:', error);
    throw new Error('Error printing receipt: ' + error.message); // Throw an error to send it back to the renderer
  }
});





app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Close the database connection when the application is closed
app.on('before-quit', () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
});

// Function to generate the receipt content and save it as a PDF
function generateReceiptPDF(orderDetails, filePath) {
  const { items, totalPrice, cashAmount, balance, date } = orderDetails;
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(12).text('--------------------------------', { align: 'center' });
  doc.fontSize(14).text('*** RESTAURANT ABC ***', { align: 'center' });
  doc.fontSize(12).text('--------------------------------', { align: 'center' });
  doc.moveDown();
  doc.text(`Date: ${new Date(date).toLocaleString()}`, { align: 'left' });
  doc.text('--------------------------------', { align: 'center' });
  
  // Table Headers
  doc.text('Item', 40, doc.y, { width: 200, align: 'center' });
  doc.text('Qty', 240, doc.y, { width: 50, align: 'center' });
  doc.text('Price', 300, doc.y, { width: 100, align: 'center' });
  doc.moveDown();
  doc.text('--------------------------------', { align: 'center' });

  // Table for items
  items.forEach(item => {
    doc
      .text(item.name, 40, doc.y, { width: 200, align: 'center' })
      .text(item.quantity.toString(), 240, doc.y, { width: 50, align: 'center' })
      .text(`$${Number(item.price).toFixed(2)}`, 300, doc.y, { width: 100, align: 'center' })
      .moveDown(0.5);
  });

  doc.text('--------------------------------', { align: 'center' });

  // Totals
  doc.text('Total: ', 40, doc.y, { width: 150, align: 'left' });
  doc.text(`$${Number(totalPrice).toFixed(2)}`, 300, doc.y, { width: 100, align: 'right' });
  doc.moveDown(0.5);
  
  doc.text('Cash: ', 40, doc.y, { width: 150, align: 'left' });
  doc.text(`$${Number(cashAmount).toFixed(2)}`, 300, doc.y, { width: 100, align: 'right' });
  doc.moveDown(0.5);
  
  doc.text('Balance: ', 40, doc.y, { width: 150, align: 'left' });
  doc.text(`$${Number(balance).toFixed(2)}`, 300, doc.y, { width: 100, align: 'right' });
  doc.moveDown(0.5);
  
  doc.text('--------------------------------', { align: 'center' });

  // Footer
  doc.moveDown();
  doc.text('Thank you Come Again.....!', { align: 'center' });
  doc.text('--------------------------------', { align: 'center' });

  doc.end();
}





async function generateAndPrintReceipt(orderDetails) {
  const filePath = 'receipt.pdf';

  // Generate the PDF
  generateReceiptPDF(orderDetails, filePath);

  // Print the generated PDF
  try {
    await printer.print(filePath);
    console.log('Receipt printed successfully.');

    // Delete the PDF after printing
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting receipt PDF:', err);
      } else {
        console.log('Receipt PDF deleted successfully.');
      }
    });
  } catch (error) {
    console.error('Error while printing receipt:', error);
  }
}