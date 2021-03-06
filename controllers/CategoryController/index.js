const express = require('express');

const router = express.Router();

const withCatchAsync = require('../../common/catchAsyncErrors');
const CategoryController = require('./CategoryController');

const getAllProducts = async (req, res) => {
  try {
    const categoryController = new CategoryController();

    const products = await categoryController.getAllProductsById(req.params.id, req.query.page);

    return res.json(products);
  } catch (error) {
    throw error;
  }
};

router.get('/:id(\\d+)/products', withCatchAsync(getAllProducts));

module.exports = router;
