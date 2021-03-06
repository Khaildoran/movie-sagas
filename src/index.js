import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App/App.js';
import registerServiceWorker from './registerServiceWorker';
import { createStore, combineReducers, applyMiddleware } from 'redux';
// Provider allows us to use redux within our react app
import { Provider } from 'react-redux';
import logger from 'redux-logger';
// Import saga middleware
import createSagaMiddleware from 'redux-saga';
import {put, takeEvery} from 'redux-saga/effects'
import Axios from 'axios';

import {router_PushToHistory} from './library/navigation'

// Create the rootSaga generator function
function* rootSaga() {
    yield takeEvery("FETCH_MOVIE_LIST", fetchMoviesList)  //get movie sql table
    yield takeEvery("FETCH_MOVIE_DETAILS", fetchMovieDetails) // get movie details for a given movie
    yield takeEvery("FETCH_GENRES", fetchGenres)  // get genre sql table
    yield takeEvery("POST_NEW_MOVIE", postNewMovie) // movie router - POST request for new movie
    yield takeEvery("UPDATE_MOVIE", updateMovie)  // movie router - PU request to edit move
}
function* fetchMoviesList() {
    try {
        const movieList = yield Axios.get('/api/movie')
        yield put({
            type: "SET_MOVIES",
            payload: movieList.data
        })
    } catch (error) {
        console.log(error);
    }
}
function* fetchMovieDetails(action) {
    let movieId = action.payload.id;
    try {
        // movie details will contain the data that the details page will use to display things. 
        const movieDetails = yield Axios.get(`/api/movie/${movieId}`);
        // add the movie details (full data) to redux state
        console.log(movieDetails.data);
        yield put ({
            type: "SET_DETAILS",
            payload: movieDetails.data
        })
    } catch (error) {
        console.log(error);
    }
}
function* fetchGenres() {
    try {
        const genresList = yield Axios.get('/api/genre') // get list of genres
        yield put({          // add data from get request to genres reducer
            type: "SET_GENRES",
            payload: genresList.data
        })
    } catch (error) {
        console.log(error);
    }
}

function* postNewMovie(action) {
    try {
        yield Axios.post('/api/movie', action.payload.data) // post new movie 
        yield alert("Movie added to list! Returning to Home page")  // give the user some sort of confirmation the form was submitted 
        yield router_PushToHistory('/', action.payload.nav) // upon successful post, return user to movie list
    } catch (error) {
        alert('Failed to add movie. Please try again. ') // let the user know if submission failed
    }
}
function* updateMovie(action) {
    try {
       yield Axios.put('/api/movie', action.payload.data)
       router_PushToHistory('/', action.payload.nav) 
    } catch (error) {
        console.log(error);
        alert('failed to edit new movie. Please try again')
    }
}

// Create sagaMiddleware
const sagaMiddleware = createSagaMiddleware();

// Used to store movies returned from the server
const movies = (state = [], action) => {
    switch (action.type) {
        case 'SET_MOVIES':
            console.log(action.payload);
            return action.payload;
        default:
            return state;
    }
}

// Used to store the movie genres
const genres = (state = [], action) => {
    switch (action.type) {
        case 'SET_GENRES':
            return action.payload;
        default:
            return state;
    }
}

const detailState = {
    // detail state represents the JSON structure of the movie details reducer.
    // The detail page is looking for this data when it is called. 
    movieDetails: [
      {
        id: 0,
        title: 'Movie Title',
        poster: 'poster path',
        description: "movie description"
      }
    ],
    movieGenres: [
      { id: 0, movies_id: 0, genres_id: 0, name: 'genre name' },
    ]
  }
const movieDetails = (state = detailState, action) => {
    switch (action.type) {
        case "SET_DETAILS":
            return action.payload;
        default:
            return state;
    }
}

// Create one store that all components can use
const storeInstance = createStore(
    combineReducers({
        movies,
        genres,
        movieDetails,
    }),
    // Add sagaMiddleware to our store
    applyMiddleware(sagaMiddleware, logger),
);

// Pass rootSaga into our sagaMiddleware
sagaMiddleware.run(rootSaga);

ReactDOM.render(<Provider store={storeInstance}><App /></Provider>, 
    document.getElementById('root'));
registerServiceWorker();
