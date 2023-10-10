const path = require('path');
const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const { log } = require('console');
const { validationResult }=require('express-validator');
const moment = require('moment')



const actorsController = {
    'list': (req, res) => {
        db.Actor.findAll({
            include: ['movies']
        })
            .then(actors => {
                res.render('actorsList.ejs', {actors})
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
            return res.render('actorsAdd',{
                genres,
                actors
            })
        })
        .catch(error => console.log(error));
    },
    create: function (req,res) {
        let errors=validationResult(req)
        if(errors.isEmpty()){
            
            const {first_name,last_name,rating}=req.body

            db.Actor.create({
                first_name,
                last_name,
                rating
            })
            
            .then((actors) => {
                
              console.log(actors);
                    return res.redirect('/actors')
                   
               
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
                    genre_id
    
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

    }
}

module.exports = actorsController;