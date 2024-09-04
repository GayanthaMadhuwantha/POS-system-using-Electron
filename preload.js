const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Fetch all food items
  getFoodItems: () => ipcRenderer.invoke('get-food-items'),

  // Save an order
  saveOrder: (orderDetails) => ipcRenderer.invoke('save-order', orderDetails),

  printOrder: (orderDetails) => ipcRenderer.invoke('generate-print-receipt',orderDetails),

  addSupplier:(newSupplierName, newMobile, newAddress)=> ipcRenderer.invoke('add-supplier',newSupplierName, newMobile, newAddress),

  getSupplier:() => ipcRenderer.invoke('get-supplier'),

  removeSupplier:(supplierId) => ipcRenderer.invoke('remove-supplier',supplierId),

  updateSupplier:(supplierId, newSupplierName, newMobile, newAddress) => ipcRenderer.invoke('update-supplier',supplierId, newSupplierName, newMobile, newAddress),

  addProduct:(newSupplierName, categorynameName, productname, productcount, stockprice, wholesaleprice, discount) => ipcRenderer.invoke('add-product',newSupplierName, categorynameName, productname, productcount, stockprice, wholesaleprice, discount),

  // Remove an order by ID
  removeOrder: (orderId) => ipcRenderer.invoke('remove-order', orderId),

  // Add a new food item
  addFoodItem:(name, price) => ipcRenderer.invoke('add-food-item', name, price),

  // Remove a food item by name
  removeFoodItem: (name) => ipcRenderer.invoke('remove-food-item', name),

  // Update a food item price
  updateFoodItemPrice: (name, price) => ipcRenderer.invoke('update-food-item-price', name, price),

  //getOrderDetails: () => ipcRenderer.invoke('get-order-details'),

  // Additional APIs can be added here...
});

