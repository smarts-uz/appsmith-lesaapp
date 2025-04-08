export default {
	createProduct: async () => {
		// Future logic for creating a product
		return null;
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
	}
};
