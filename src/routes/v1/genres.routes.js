const router = require('express').Router();
const {index,show} = require('../../controllers/APIs/apiGenres.Controller');

// api/v1/genres

router
        .get('/',index)
        .get('/:id',show)

module.exports = router;