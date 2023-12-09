
const db = require('../database/models');
const { validationResult }=require('express-validator');
const moment = require('moment')
const paginate = require('express-paginate')
const { Op } = require("sequelize");
const API = 'http://www.omdbapi.com/?apikey=4974894';
const axios = require('axios');
const translatte = require('translatte')

const moviesController = {
    'list': (req, res) => {

        db.Movie.findAndCountAll({
            include: ['genre'],
            limit: req.query.limit,
            offset: req.skip
        })
            .then(({count,rows}) => {
                const pagesCount = Math.ceil(count / req.query.limit)

                res.render('moviesList', {
                movies : rows,
                pages: paginate.getArrayPages(req)(pagesCount, pagesCount, req.query.page),
                paginate,
                pagesCount,
                currentPage :  req.query.page
            })
            })
    },
    'detail': (req, res) => {
        db.Movie.findByPk(req.params.id,{
            include:['actors']
        })
            .then(movie => {
              return  res.render('moviesDetail', {...movie.dataValues, moment});
            });
    },
    'new': (req, res) => {
        db.Movie.findAll({
            order : [
                ['release_date', 'DESC']
            ],
            limit: 5
        })
            .then(movies => {
                res.render('newestMovies', {movies});
            });
    },
    'recomended': (req, res) => {
        db.Movie.findAll({
            where: {
                rating: {[db.Sequelize.Op.gte] : 8}
            },
            order: [
                ['rating', 'DESC']
            ]
        })
            .then(movies => {
                res.render('recommendedMovies.ejs', {movies});
            });
    },
     //Aqui debo modificar para crear la funcionalidad requerida
     'buscar': (req, res) => {
        const title = req.query.titulo;

        fetch(`${API}&t=${title}`)
        .then(data => {
          return data.json() 
        })
        .then(movie => {            
            return res.render('moviesDetailOmdb',{movie})
        })
        .catch(error => console.log(error))
    },
    //Aqui dispongo las rutas para trabajar con el CRUD
    add: function (req, res) {
        const actors = db.Actor.findAll({
            order: [['first_name'],
            ['last_name']]
        })
        const genres = db.Genre.findAll({
            order: ['name']
        })
        Promise.all([actors,genres])
        .then(([actors,genres])=> {
            return res.render('moviesAdd',{
                genres,
                actors
            })
        })
        .catch(error => console.log(error));
    },
    create: function (req,res) {
        let errors=validationResult(req)
        if(errors.isEmpty()){
            
            const {title,rating,release_date,awards,length,genre_id}=req.body

            const actors = [req.body.actors].flat()
            console.log('<<<<<<<<<<<<',actors);

            db.Movie.create({
                title: title.trim(),
                rating,
                release_date,
                awards,
                length,
                genre_id,
                actors
            })
            
            .then((movie) => {
                
                if(actors){
                    const actorsDB = actors.map(actor => {
                        return {
                            movie_id: movie.id,
                            actor_id: actor
                        }
                    })
                    db.Actor_Movie.bulkCreate(actorsDB,{
                        validate:true
                   }).then(() =>{ 
                    console.log('actores agregados')})
                    return res.redirect('/movies')
                   }else {
                    return res.redirect('/movies')
                   }
               
            }).catch(error => console.log(error));
        } else {
            const actors = db.Actor.findAll({
                order: [['first_name'],
                ['last_name']]
            })
            const genres = db.Genre.findAll({
                order: ['name']
            })
            Promise.all([actors,genres])
            .then(([actors,genres])=> {
                return res.render('moviesAdd',{
                    genres,
                    actors,
                    errors : errors.mapped(),
                    old : req.body
                })
            }).catch(error => console.log(error))
        }
    },
    edit: function(req,res) {

      const genres =  db.Genre.findAll({
            order: ['name']
        })
        const Movie = db.Movie.findByPk(req.params.id,{
            include: ['actors']
        })
        const actors = db.Actor.findAll({
            order: [['first_name'],
            ['last_name']]
        })
        Promise.all([genres,Movie,actors])

        .then(([genres,Movie,actors])=> {
            return res.render('moviesEdit',{
                genres,
                Movie,
                moment,
                actors
            })
        })
        .catch(error => console.log(error));
    },
    update: function (req,res) {

        let errors=validationResult(req)
        if(errors.isEmpty()){
        let {title,rating,awards,length,release_date,genre_id,actors} = req.body
        actors = typeof actors ==="string" ? [actors]:actors
        
        db.Movie.findByPk(req.params.id,{
            include:['actors']
        
        }).then(movie => {
            db.Movie.update(
                {
                    title : title.trim(),
                    awards,
                    rating,
                    release_date,
                    length,
                    genre_id,
                    image : req.file ? req.file.filename : null
    
                },
                {
                    where: {
                        id: req.params.id
                    }
                })
                .then(()=> {
                   db.Actor_Movie.destroy({
                    where:{
                        movie_id: req.params.id
                    }
                   }).then(()=> {
                    if(actors){
                    const actorsDB = actors.map(actor => {
                        return {
                            movie_id: req.params.id,
                            actor_id: actor
                        }
                    })
                    db.Actor_Movie.bulkCreate(actorsDB,{
                        validate:true
                    }
                    )}
                   }).then(() => {
                    console.log('actores agregados')
                   })
                })
        })
        .catch(error => console.log(error))
        .finally(()=> res.redirect('/movies'))
        }  else {
           const Movie= db.Movie.findByPk(req.params.id,{
                include:['actors']
            
            })
                const actors = db.Actor.findAll({
                    order: [['first_name'],
                    ['last_name']]
                })
                const genres = db.Genre.findAll({
                    order: ['name']
                })
                Promise.all([Movie,actors,genres])
                .then(([Movie,actors,genres])=> {
                    return res.render('moviesEdit',{
                        genres,
                        actors,
                        Movie,
                        moment,
                        errors : errors.mapped(),
                        old : req.body
                    })
                }).catch(error => console.log(error))
            
        } 
    },
    delete: function (req,res) {


    },
    destroy: function (req,res) {

        db.Actor_Movie.destroy({
            where:{
                movie_id:req.params.id
            }
        })
        .then(()=> {
            db.Actor.update(
                {
                    favorite_movie_id:null
                },
                {
                    where:{
                        favorite_movie_id: req.params.id
                    }
                })
                .then(() =>{
                    db.Movie.destroy({
                        where:{
                            id:req.params.id
                        }
                    })
                    .then(()=> {
                        return res.redirect('/movies')

                } )
        })

        
        }).catch(error => console.log(error))

    },
    search: (req,res) => {
      
        const keyword = req.query.keyword
        db.Movie.findAll({
            where: {
                title : {
                    [Op.substring]: keyword
                }
            }
        }).then( movies => {
             if(!movies.length){
                axios.get(API + `&t=${keyword}`)
                .then(async (response) => {
                    const {Title, Released,Genre,Awards,Poster,Ratings} = response.data

                    const awardsArray = Awards.match(/\d+/g)
                    const awardsParseado = awardsArray.map(award => +award)
                    const awards =  awardsParseado.reduce((acum,num) => acum + num,0) || 2
                    
                    const rating = Ratings[0].Value.split('/')[0]

                    const release_date = moment(Released).toDate()

                    const image = Poster
     
                    const newGenre = Genre.split(',')[0]
                    let genre_id;
                    if(newGenre){
                     const {text}= await translatte(newGenre, {to: 'es'}) //traduce el genero
                   
                        const genres = await db.Genre.findAll({order : [['ranking','DESC']]})
                      
                        const [genre, genreCreated ]= await db.Genre.findOrCreate({
                            where : { name: text },
                            default:{
                                active: 1,
                                ranking: genres[0].ranking +1
                            }   
                        });
                        genre_id = genre.id
                    }
                    
                    let newMovie = {
                        title:Title,
                        awards:awards,
                        rating: rating,
                        release_date,
                        genre_id,
                        image
                    }
                    db.Movie.create(newMovie)
                    .then(() =>  db.Movie.findAll({
                        where: {
                            title : {
                                [Op.substring]: keyword
                            }
                        }
                    })
                    .then(movies => {
                        return res.render('moviesList', {
                            movies,
                            pages: paginate.getArrayPages(req)(1, 1, req.query.page),
                            paginate,
                            currentPage :  req.query.page,
                            result : 1
                        }) 
                    }))
                })
            } else {
                return res.render('moviesList', {
                    movies,
                    pages: paginate.getArrayPages(req)(1, 1, req.query.page),
                    paginate,
                    currentPage :  req.query.page,
                    result : 1
                }) 
            }
         
        }).catch(error => console.log(error))
    }
}

module.exports = moviesController;