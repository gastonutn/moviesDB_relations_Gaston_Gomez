const path = require('path');
const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const { log } = require('console');
const { validationResult }=require('express-validator');
const moment = require('moment')

//Aqui tienen una forma de llamar a cada uno de los modelos
// const {Movies,Genres,Actor} = require('../database/models');

//Aquí tienen otra forma de llamar a los modelos creados
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;


const moviesController = {
    'list': (req, res) => {
        db.Movie.findAll({
            include: ['genre']
        })
            .then(movies => {
                res.render('moviesList', {movies})
            })
    },
    'detail': (req, res) => {
        db.Movie.findByPk(req.params.id)
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
        db.Genre.findAll({
            order: ['name']
        })
        .then(genres=> {
            return res.render('moviesAdd',{
                genres
            })
        })
        .catch(error => console.log(error));
    },
    create: function (req,res) {
        let errors=validationResult(req)
        if(errors.isEmpty()){
            const {title,rating,release_date,awards,length}=req.body
            db.Movie.create({
                title: title.trim(),
                rating,
                release_date,
                awards,
                length,
    
            })
            .then(movie => {
                console.log(movie);
                return res.redirect('/movies')
            })

        }else { 
            return res.render('moviesAdd',{
                errors: errors.mapped(),
                old: req.body
            })

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
                    console.log('actores agregados');
                   })
                })

    

        }).catch(error => console.log(error))
        .finally(()=> res.redirect('/movies'))
       
    },
    delete: function (req,res) {

    },
    destroy: function (req,res) {

    }
}
// actors.forEach(actor => {
//     if(!movie.actors.map(actor => actor.id).includes(actor)){

//     }
// });
module.exports = moviesController;