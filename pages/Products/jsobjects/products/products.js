export default {
  // Transform functions
  
  /**
   * Groups products with their metadata from raw query results
   */
  groupProductsWithMetadata: (products) => {
    return products.reduce((acc, curr) => {
      const id = curr.ID.toString();
      if (!acc[id]) {
        acc[id] = {
          ID: curr.ID,
          post_title: curr.post_title,
          post_content: curr.post_content,
          post_excerpt: curr.post_excerpt,
          post_name: curr.post_name,
          post_date: curr.post_date,
          post_modified: curr.post_modified,
          meta: {},
          is_bundle: curr.is_bundle ? curr.is_bundle > 0 : false,
          image_url: curr.image_url,
        };
      }
      if (curr.meta_key) {
        acc[id].meta[curr.meta_key] = curr.meta_value || undefined;
      }
      return acc;
    }, {});
  },

  /**
   * Extracts product IDs from grouped products
   */
  extractProductIds: (groupedProducts) => {
    return Object.keys(groupedProducts);
  },

  /**
   * Groups categories by product ID
   */
  groupCategoriesByProduct: (productCategories) => {
    const categoriesByProduct = {};
    productCategories.forEach((category) => {
      const productId = category.object_id.toString();
      if (!categoriesByProduct[productId]) {
        categoriesByProduct[productId] = [];
      }
      categoriesByProduct[productId].push(category.name);
    });
    return categoriesByProduct;
  },

  /**
   * Extracts bundle IDs from grouped products
   */
  extractBundleIds: (groupedProducts) => {
    return Object.values(groupedProducts)
      .filter(product => product.is_bundle)
      .map(product => product.ID);
  },

  /**
   * Initializes bundled items data structure
   */
  initializeBundledItems: (bundledItems) => {
    const bundledItemsData = {};
    
    bundledItems.forEach((item) => {
      const bundleId = item.bundle_id.toString();
      if (!bundledItemsData[bundleId]) {
        bundledItemsData[bundleId] = [];
      }
      bundledItemsData[bundleId].push({
        ...item,
        child_price: null,
        child_meta: {},
      });
    });
    
    return bundledItemsData;
  },

  /**
   * Extracts bundled item IDs from bundled items
   */
  extractBundledItemIds: (bundledItems) => {
    return bundledItems.map(item => item.bundled_item_id);
  },

  /**
   * Extracts product IDs from bundled items
   */
  extractBundledProductIds: (bundledItems) => {
    return bundledItems.map(item => item.product_id);
  },

  /**
   * Updates bundled items with prices
   */
  updateBundledItemsWithPrices: (bundledItemsData, bundledProductPrices) => {
    bundledProductPrices.forEach((priceData) => {
      const productId = priceData.product_id;
      
      for (const bundleId in bundledItemsData) {
        bundledItemsData[bundleId].forEach((item) => {
          if (item.product_id === productId) {
            item.child_price = priceData.meta_value;
          }
        });
      }
    });
    
    return bundledItemsData;
  },

  /**
   * Updates bundled items with metadata
   */
  updateBundledItemsWithMetadata: (bundledItemsData, bundledItemMetadata) => {
    bundledItemMetadata.forEach((meta) => {
      const itemId = meta.bundled_item_id;
      
      for (const bundleId in bundledItemsData) {
        const itemIndex = bundledItemsData[bundleId].findIndex(
          (item) => item.bundled_item_id === itemId
        );
        
        if (itemIndex >= 0 && meta.meta_key) {
          bundledItemsData[bundleId][itemIndex].child_meta[meta.meta_key] = meta.meta_value;
        }
      }
    });
    
    return bundledItemsData;
  },

  /**
   * Updates bundled items with stock information
   */
  updateBundledItemsWithStock: (bundledItemsData, bundledItemStock) => {
    bundledItemStock.forEach((stockData) => {
      const productId = stockData.product_id;
      
      for (const bundleId in bundledItemsData) {
        bundledItemsData[bundleId].forEach((item) => {
          if (item.product_id === productId) {
            item.child_meta["_stock"] = stockData.meta_value;
          }
        });
      }
    });
    
    return bundledItemsData;
  },

  /**
   * Creates the final product structure combining all data
   */
  createFinalProductStructure: (groupedProducts, categoriesByProduct, bundledItemsData) => {
    return Object.values(groupedProducts).map((product) => {
      const isBundle = product.is_bundle;
      const productId = product.ID.toString();
      const productCategories =
        categoriesByProduct[productId] ||
        (product.post_title.toLowerCase().includes("scaffold")
          ? ["Scaffolding"]
          : ["Safety"]);

      const bundledItems =
        isBundle && bundledItemsData[productId]
          ? bundledItemsData[productId].map((item) => ({
              id: Number(item.bundled_item_id),
              productId: Number(item.product_id),
              name: item.child_post_title,
              price: Number(item.child_price || 0),
              defaultQuantity: Number(item.child_meta["default_quantity"] || 1),
              minQuantity: Number(item.child_meta["min_quantity"] || 1),
              maxQuantity: Number(item.child_meta["max_quantity"]),
              optional: item.child_meta["optional"] === "yes",
              menuOrder: Number(item.menu_order),
              visibility: item.child_meta["visibility"] || "visible",
              discount: item.child_meta["discount"] || null,
              priceVisibility: item.child_meta["price_visibility"] || "visible",
              stock: Number(item.child_meta["_stock"] || 0),
              allMeta: item.child_meta,
            }))
          : undefined;

      // Calculate on sale status
      const regularPrice = Number(product.meta["_regular_price"] || 0);
      const salePrice = Number(product.meta["_sale_price"] || 0);
      const isOnSale =
        product.meta["_sale_price"] !== undefined &&
        salePrice > 0 &&
        salePrice < regularPrice;

      return {
        id: Number(product.ID),
        name: product.post_title,
        description: product.post_content,
        excerpt: product.post_excerpt,
        slug: product.post_name,
        dateCreated: product.post_date,
        dateModified: product.post_modified,
        price: Number(product.meta["_price"] || 0),
        regularPrice: regularPrice,
        salePrice: salePrice,
        stock: Number(product.meta["_stock"] || 0),
        stockStatus: product.meta["_stock_status"] || "instock",
        manageStock: product.meta["_manage_stock"] === "yes",
        sku: product.meta["_sku"],
        virtual: product.meta["_virtual"] === "yes",
        downloadable: product.meta["_downloadable"] === "yes",
        taxStatus: product.meta["_tax_status"] || "taxable",
        taxClass: product.meta["_tax_class"] || "",
        weight: product.meta["_weight"] || "",
        length: product.meta["_length"] || "",
        width: product.meta["_width"] || "",
        height: product.meta["_height"] || "",
        categories: productCategories,
        onSale: isOnSale,
        type: isBundle ? "bundle" : "simple",
        bundledItems,
        allMeta: product.meta,
        image: product.image_url || "/placeholder.svg?height=200&width=200",
      };
    });
  },

  /**
   * Main function to process all product data from Appsmith queries
   */
  processProductData: (
    rawProducts, 
    rawCategories = [], 
    rawBundledItems = [], 
    rawBundledPrices = [], 
    rawBundledMetadata = [], 
    rawBundledStock = []
  ) => {
    const groupedProducts = this.groupProductsWithMetadata(rawProducts);
    const categoriesByProduct = this.groupCategoriesByProduct(rawCategories);
    let bundledItemsData = {};
    
    if (rawBundledItems.length > 0) {
      bundledItemsData = this.initializeBundledItems(rawBundledItems);
      bundledItemsData = this.updateBundledItemsWithPrices(bundledItemsData, rawBundledPrices);
      bundledItemsData = this.updateBundledItemsWithMetadata(bundledItemsData, rawBundledMetadata);
      bundledItemsData = this.updateBundledItemsWithStock(bundledItemsData, rawBundledStock);
    }
    
    return this.createFinalProductStructure(groupedProducts, categoriesByProduct, bundledItemsData);
  },

  // Fetching functions
  
  /**
   * Fetches all products data using sequential Appsmith query calls
   */
  fetchAllProducts: async () => {
    try {
      const rawProducts = await getProductsWithMetadata.run();
      if (!rawProducts || rawProducts.length === 0) {
        return { data: [] };
      }
      
      const groupedProducts = this.groupProductsWithMetadata(rawProducts);
      const productIds = this.extractProductIds(groupedProducts);
      const rawCategories = await getProductCategories.run({
        productIds: productIds.join(',')
      });
      
      const bundleIds = this.extractBundleIds(groupedProducts);
      let rawBundledItems = [], rawBundledPrices = [], rawBundledMetadata = [], rawBundledStock = [];
      
      if (bundleIds && bundleIds.length > 0) {
        rawBundledItems = await getBundledItems.run({
          bundleIds: bundleIds.join(',')
        });
        
        if (rawBundledItems && rawBundledItems.length > 0) {
          const bundledProductIds = this.extractBundledProductIds(rawBundledItems);
          rawBundledPrices = await getBundledItemPrices.run({
            bundledProductIds: bundledProductIds.join(',')
          });
          
          const bundledItemIds = this.extractBundledItemIds(rawBundledItems);
          rawBundledMetadata = await getBundledItemMetadata.run({
            bundledItemIds: bundledItemIds.join(',')
          });
          
          rawBundledStock = await getBundledItemStock.run({
            bundledProductIds: bundledProductIds.join(',')
          });
        }
      }
      
      const processedData = this.processProductData(
        rawProducts,
        rawCategories,
        rawBundledItems,
        rawBundledPrices,
        rawBundledMetadata,
        rawBundledStock
      );
      
      return { data: processedData };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Fetches products by category
   */
  fetchProductsByCategory: async (category) => {
    try {
      const allProductsResponse = await this.fetchAllProducts();
      const allProducts = allProductsResponse.data;
      
      if (!category) {
        return { data: allProducts };
      }
      
      const filteredProducts = allProducts.filter(product => 
        product.categories.some(cat => 
          cat.toLowerCase() === category.toLowerCase()
        )
      );
      
      return { data: filteredProducts };
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Fetches a single product by ID
   */
  fetchProductById: async (productId) => {
    try {
      const allProductsResponse = await this.fetchAllProducts();
      const allProducts = allProductsResponse.data;
      
      if (!productId) {
        return { data: null };
      }
      
      const product = allProducts.find(product => product.id === Number(productId)) || null;
      
      return { data: product };
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return { data: null, error: error.message };
    }
  },

  /**
   * Searches products by name or description
   */
  searchProducts: async (searchTerm) => {
    try {
      const allProductsResponse = await this.fetchAllProducts();
      const allProducts = allProductsResponse.data;
      
      if (!searchTerm) {
        return { data: allProducts };
      }
      
      const term = searchTerm.toLowerCase();
      
      const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.excerpt.toLowerCase().includes(term) ||
        (product.sku && product.sku.toLowerCase().includes(term))
      );
      
      return { data: filteredProducts };
    } catch (error) {
      console.error('Error searching products:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Gets all available product categories
   */
  getAllCategories: async () => {
    try {
      const allProductsResponse = await this.fetchAllProducts();
      const allProducts = allProductsResponse.data;
      
      const allCategories = allProducts.flatMap(product => product.categories);
      const uniqueCategories = [...new Set(allCategories)].sort();
      
      return { data: uniqueCategories };
    } catch (error) {
      console.error('Error getting all categories:', error);
      return { data: [], error: error.message };
    }
  },
  
  /**
   * Gets products on sale
   */
  getProductsOnSale: async () => {
    try {
      const allProductsResponse = await this.fetchAllProducts();
      const allProducts = allProductsResponse.data;
      
      const productsOnSale = allProducts.filter(product => product.onSale);
      
      return { data: productsOnSale };
    } catch (error) {
      console.error('Error getting products on sale:', error);
      return { data: [], error: error.message };
    }
  },
  
  /**
   * Gets bundles only
   */
  getBundleProducts: async () => {
    try {
      const allProductsResponse = await this.fetchAllProducts();
      const allProducts = allProductsResponse.data;
      
      const bundleProducts = allProducts.filter(product => product.type === 'bundle');
      
      return { data: bundleProducts };
    } catch (error) {
      console.error('Error getting bundle products:', error);
      return { data: [], error: error.message };
    }
  },
  
  /**
   * Gets products by stock status
   */
  getProductsByStockStatus: async (status) => {
    try {
      const allProductsResponse = await this.fetchAllProducts();
      const allProducts = allProductsResponse.data;
      
      if (!status) {
        return { data: allProducts };
      }
      
      const filteredProducts = allProducts.filter(product => 
        product.stockStatus.toLowerCase() === status.toLowerCase()
      );
      
      return { data: filteredProducts };
    } catch (error) {
      console.error('Error getting products by stock status:', error);
      return { data: [], error: error.message };
    }
  },

  /**
   * Returns stock status with color indication
   */
  returnStockStatus: (stock, reorderPoint) => {
    if (!stock || stock < 1) {
      return {
        status: 'Out of Stock',
        color: 'RGB(255, 0, 0)'
      };
    }
    if (stock < reorderPoint) {
      return {
        status: 'Low',
        color: 'RGB(255, 165, 0)'
      };
    }
    return {
      status: 'Normal',
      color: 'RGB(0, 128, 0)'
    };
  },

  /**
   * Updates product data in Appsmith storage
   */
  updateProductData: async (products) => {
    storeValue('products', products);
    return { data: products };
  },
}; 