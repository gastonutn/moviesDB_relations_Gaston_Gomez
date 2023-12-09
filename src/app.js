const express = require('express');
const path = require('path');
const app = express();
const methodOverride = require('method-override')
const paginate = require('express-paginate');
const cors = require('cors');



const indexRouter = require('./routes/index');

const moviesRoutes = require('./routes/moviesRoutes');
const genresRoutes = require('./routes/genresRoutes');
const actorsRoutes = require('./routes/actorsRoutes');


// view engine setup
app.set('views', path.resolve(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

app.use(express.static(path.resolve(__dirname, '../public')));

//URL encode  - Para que nos pueda llegar la información desde el formulario al req.body
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use(paginate.middleware(8, 50))
app.use('/api/v1/movies', require('./routes/v1/movies.routes'))
app.use('/api/v1/genres', require('./routes/v1/genres.routes'))

app.use('/', indexRouter);
app.use(moviesRoutes);
app.use(genresRoutes);
app.use(actorsRoutes);

app.listen('3001', () => console.log('Servidor corriendo en el puerto 3001'));
