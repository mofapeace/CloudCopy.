require('dotenv').config({ path: '../.env' });

const BW_PRICE = parseInt(process.env.PRICE_PER_PAGE_BW || '25', 10);
const COLOR_PRICE = parseInt(process.env.PRICE_PER_PAGE_COLOR || '75', 10);

/**
 * Calculates the price of a print job using sheet-based logic
 */
function calculatePrice(pages, color, doubleSided, copies, colorPagesMap = []) {
  let totalCost = 0;

  if (doubleSided) {
    // Group into sheets
    for (let i = 0; i < pages; i += 2) {
      const page1Color = colorPagesMap[i] === true || colorPagesMap[i] === 'true';
      const page2Color = colorPagesMap[i + 1] === true || colorPagesMap[i + 1] === 'true';
      
      if (color && (page1Color || page2Color)) {
        totalCost += COLOR_PRICE;
      } else {
        totalCost += BW_PRICE;
      }
    }
  } else {
    // Single sided
    for (let i = 0; i < pages; i++) {
      const isColorPage = colorPagesMap[i] === true || colorPagesMap[i] === 'true';
      if (color && isColorPage) {
        totalCost += COLOR_PRICE;
      } else {
        totalCost += BW_PRICE;
      }
    }
  }

  return totalCost * copies;
}

module.exports = { calculatePrice };
