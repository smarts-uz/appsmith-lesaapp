export default {

	processCustomerData(customers) {
		if (!customers || !Array.isArray(customers)) return [];

		return customers.map(customer => ({
			id: customer.id?.toString() || '',
			username: customer.username || '',
			email: customer.email || '',
			displayName: customer.displayName || '',
			firstName: customer.firstName || '',
			lastName: customer.lastName || '',
			// Concatenate first and last names if available; otherwise fallback to displayName.
			fullName: (customer.firstName || customer.lastName)
			? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
			: customer.displayName || '',
			phone: customer.phone || '',
			dateRegistered: customer.dateRegistered || '',
			lastActive: customer.lastActive || '',
			is_blacklist: customer.is_blacklist || 0,
			client_type: customer.client_type || '',
			// Combine location parts (city, state, country) into a single string.
			location: [customer.city, customer.state, customer.country].filter(Boolean).join(', ')
		}));
	},
	createPagination(total, page, limit) {
		const totalPages = Math.ceil(total / limit);
		return {
			total,
			page,
			limit,
			pages: totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
		};
	}
};
