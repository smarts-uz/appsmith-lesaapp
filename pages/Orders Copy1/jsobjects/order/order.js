export default {
	 addProduct: (productId, quantity, price) => {
    const product = order.getProductById(productId);
    if (!product) return;

    const cartItem = {
      product_id: product.ID,
      price: parseFloat(price) || parseFloat(product.sale_price || product.regular_price) || 0,
      quantity: parseInt(quantity) || 1,
      // type: product.product_type
    };

    const currentCart = appsmith.store.cartItems || [];

    // Optional: replace item if it already exists
    const filteredCart = currentCart.filter(item => item.product_id !== cartItem.product_id);

    storeValue('cartItems', [...filteredCart, cartItem]);
  },
	 removeProduct: (productId) => {
    const currentCart = appsmith.store.cartItems || [];
    const updatedCart = currentCart.filter(item => item.product_id !== productId);

    storeValue('cartItems', updatedCart);
  },
	getSelectProducts: () => {
		return getAllProducts.data
			.filter(p => p.ID)
			.map(p => {
			const isBundle = p.product_type === 'bundle';
			const icon = isBundle ? '📦' : "" ;
			const price = p.sale_price || p.regular_price || 'N/A';

			return {
				label: `${icon} ${p.post_title} (${price})`,
				value: p.ID
			};
		});
	},
	getProductById: (id) => {
		if (!id) return null;
		return getAllProducts.data.find(p => p.ID === id) || null;
	},
	getSelectCustomers: () => {
		return getAllCustomers.data.filter(p => p.id)
			.map(p => ({
			label: `${p.username}`,
			value: p.id
		}));
	}
};
