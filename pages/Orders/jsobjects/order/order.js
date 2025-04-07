export default {
  groupOrders(data) {
    const grouped = {};

    data.forEach((row) => {
      const orderId = row.order_id;

      if (!grouped[orderId]) {
        grouped[orderId] = {
          order_id: orderId,
          date_created_gmt: row.date_created_gmt,
          status: row.order_status,
          total_amount: row.total_amount,
          payment_method: row.payment_method,
          payment_method_title: row.payment_method_title,
          customer: {
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone,
            address_1: row.address_1,
            city: row.city,
            country: row.country,
          },
          items: [],
        };
      }

      grouped[orderId].items.push({
        order_item_id: row.order_item_id,
        name: row.order_item_name,
        product_id: row.product_id,
        variation_id: row.variation_id,
        quantity: parseInt(row.quantity) || 0,
        subtotal: parseFloat(row.subtotal) || 0,
        total: parseFloat(row.total) || 0,
      });
    });

    return Object.values(grouped);
  },
};
