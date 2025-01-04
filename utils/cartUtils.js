exports.isProductInCart = (cart, id) => {
    return cart.some(item => item.id == id);
  };
  
  exports.calculateTotal = (cart, req) => {
    const total = cart.reduce((sum, item) => sum + (item.sale_price || item.price) * item.quantity, 0);
    req.session.total = total;
    return total;
  };
  