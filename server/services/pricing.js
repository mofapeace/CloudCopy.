require('dotenv').config({ path: '../.env' });
const supabase = require('../supabase');

/**
 * Calculates price for a single shop's pricing tier
 * @param {number} pages - Total pages
 * @param {boolean} isColor - Color mode
 * @param {boolean} isDoubleSided - Double-sided mode
 * @param {number} copies - Number of copies
 * @param {number} bwPrice - B&W price per page in CFA
 * @param {number} colorPrice - Color price per page in CFA
 * @param {array} colorPagesMap - Optional: which pages are color
 */
function calculatePriceForShop(pages, isColor, isDoubleSided, copies, bwPrice, colorPrice, bwDoubleSidedPrice, colorDoubleSidedPrice, colorPagesMap = []) {
  let totalPages = 0;
  
  if (isDoubleSided) {
    // Double-sided: group pages into sheets
    totalPages = Math.ceil(pages / 2);
  } else {
    // Single-sided: each page is a page to print
    totalPages = pages;
  }

  let costPerCopy = 0;

  if (isColor && colorPagesMap.length > 0) {
    // Smart color detection: charge color only for color pages
    for (let i = 0; i < pages; i++) {
      const isColorPage = colorPagesMap[i] === true || colorPagesMap[i] === 'true';
      // If double sided, we should technically charge based on sheet, but if page by page map is used,
      // it's complex. For simplicity, just use single page pricing for smart color detection.
      costPerCopy += isColorPage ? colorPrice : bwPrice;
    }
  } else if (isColor) {
    // Whole document is color
    costPerCopy = isDoubleSided ? (totalPages * colorDoubleSidedPrice) : (totalPages * colorPrice);
  } else {
    // Whole document is B&W
    costPerCopy = isDoubleSided ? (totalPages * bwDoubleSidedPrice) : (totalPages * bwPrice);
  }

  return costPerCopy * copies;
}

/**
 * Gets price range for Open PIN (queries all shops)
 * @param {number} pages
 * @param {boolean} isColor
 * @param {boolean} isDoubleSided
 * @param {number} copies
 * @param {array} colorPagesMap
 */
async function getPriceRange(pages, isColor, isDoubleSided, copies, colorPagesMap = []) {
  try {
    // Fetch all online shops with their pricing
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, bw_price_per_page, color_price_per_page, bw_double_sided_price, color_double_sided_price')
      .eq('is_online', true);

    if (error) throw error;

    if (!shops || shops.length === 0) {
      // Fallback to environment defaults if no shops
      const BW_PRICE = parseInt(process.env.PRICE_PER_PAGE_BW || '15', 10);
      const COLOR_PRICE = parseInt(process.env.PRICE_PER_PAGE_COLOR || '25', 10);
      const BW_DS_PRICE = parseInt(process.env.PRICE_DS_BW || '25', 10);
      const COLOR_DS_PRICE = parseInt(process.env.PRICE_DS_COLOR || '45', 10);
      const price = calculatePriceForShop(pages, isColor, isDoubleSided, copies, BW_PRICE, COLOR_PRICE, BW_DS_PRICE, COLOR_DS_PRICE, colorPagesMap);
      return { min: price, max: price };
    }

    // Calculate price for each shop and find min/max
    const prices = shops.map(shop => 
      calculatePriceForShop(
        pages,
        isColor,
        isDoubleSided,
        copies,
        shop.bw_price_per_page || 15,
        shop.color_price_per_page || 25,
        shop.bw_double_sided_price || 25,
        shop.color_double_sided_price || 45,
        colorPagesMap
      )
    );

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  } catch (err) {
    console.error('Price Range Error:', err);
    // Fallback
    const BW_PRICE = parseInt(process.env.PRICE_PER_PAGE_BW || '15', 10);
    const COLOR_PRICE = parseInt(process.env.PRICE_PER_PAGE_COLOR || '25', 10);
    const BW_DS_PRICE = parseInt(process.env.PRICE_DS_BW || '25', 10);
    const COLOR_DS_PRICE = parseInt(process.env.PRICE_DS_COLOR || '45', 10);
    const price = calculatePriceForShop(pages, isColor, isDoubleSided, copies, BW_PRICE, COLOR_PRICE, BW_DS_PRICE, COLOR_DS_PRICE, colorPagesMap);
    return { min: price, max: price };
  }
}

/**
 * Gets exact price for a specific shop (Locked PIN)
 */
async function getExactPrice(shopId, pages, isColor, isDoubleSided, copies, colorPagesMap = []) {
  try {
    const { data: shop, error } = await supabase
      .from('shops')
      .select('bw_price_per_page, color_price_per_page, bw_double_sided_price, color_double_sided_price')
      .eq('id', shopId)
      .single();

    if (error) throw error;

    return calculatePriceForShop(
      pages,
      isColor,
      isDoubleSided,
      copies,
      shop.bw_price_per_page || 15,
      shop.color_price_per_page || 25,
      shop.bw_double_sided_price || 25,
      shop.color_double_sided_price || 45,
      colorPagesMap
    );
  } catch (err) {
    console.error('Exact Price Error:', err);
    throw err;
  }
}

module.exports = { calculatePriceForShop, getPriceRange, getExactPrice };
