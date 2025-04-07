export default {
  quantities: {},

  // Initialize from incoming list
  initialize(data) {
    data.forEach(item => {
      this.quantities[item.id] = item.count;
    });
    return true;
  },

  // Update a specific item's quantity
  update(id, newCount) {
    this.quantities[id] = newCount;
    return true;
  },

  // Retrieve current quantity for a given item
  get(id) {
    return this.quantities[id] || 0;
  },

  // Get all quantities
  all() {
    return this.quantities;
  }
};
