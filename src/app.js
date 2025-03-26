const express = require('express');
const crypto = require('node:crypto')
const z = require('zod')
const movies = require('../movies.json')
const { validateMovie, validatePartialMovie } = require('../schema/movies')



const app = express();
app.use(express.json()) 

app.disable('x-powered-by') // deshabilitar el header X-Powered-By: Express
 
app.get('/', (req, res) => {
    res.json({message: 'hola mundo'})
})

ACCEPTED_ORIGINS = [
    'http://localhost:1234',
    'http://localhost:8080'
]

app.get('/movies', (req, res) => {
    const origin = req.header('origin')
    if(ACCEPTED_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', '*')
    }

    const {genre} = req.query

    if (genre) {
        const filteredMovies = movies.filter(movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
        return res.json(filteredMovies) 
    }
    res.json(movies)
})

app.post('/movies', (req, res) => {
    
    const result = validateMovie(req.body)

 
    if (result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }
    //Próximamente en base de datos
    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    }

    //esto no sería REST, porque estamos guardando
    //el estado de la aplicación en memoria
    movies.push(newMovie)
    res.status(201).json(newMovie) //actualizar la caché del cliente
})

app.patch('/movies/:id', (req, res) => {
   
    const result = validatePartialMovie(req.body)

    if(!result.success) return res.status(400).json({message: JSON.parse(result.error.message)})

    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex === -1) return res.status(404).json({message: 'Movie not found'})

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie

    return res.json(updateMovie)
})

app.get('/movies/:id', (req, res) => { //path-to.regexp
    const {id} = req.params
    const movie = movies.find(movie => movie.id === id)
    if(movie) return res.json(movie)

    res.status(404).json({message: 'Movie not found '})
})



const PORT = process.env.PORT ?? 1234 // si no existe el puerto en el sistema, usamos el 1234

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
})


module.exports = app