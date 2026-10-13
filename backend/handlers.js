"use strict";
const { MongoClient } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;
const options = { useNewUrlParser: true, useUnifiedTopology: true };
//All of the calls here use mongoDB, make sure you have the proper .env file setup

//A patch endpoint that requires email, the song id, the song name, the picture* and the artist*
//* The two are for making the transition easier, instead of refetching every single song
// once the user decides to swap.
//It also activates the liked button if it is not arleady liked, or removes/ deactivates the likebutton
const likeSong = async (req, res) => {
  const { email, songid, songname, picture, artist } = req.body;

  if (!email || !songid || !songname || !picture || !artist) {
    return res.status(404).json({ status: 404, message: "Missing Data..." });
  }

  const songId = Number(songid);
  const client = new MongoClient(MONGO_URI, options);

  try {
    await client.connect();
    const db = client.db("finalbpm");
    const likedSongsCollection = db.collection("likesongs");

    //Each step is a single atomic update whose filter checks the song's current state,
    //so two requests at the same time (e.g. a double click) can't both add the song.
    //If another request liked the song between our two steps, the upsert fails with a
    //duplicate key error, and we loop back to unlike it so the toggle still applies.
    for (let attempt = 0; attempt < 3; attempt++) {
      const removed = await likedSongsCollection.updateOne(
        { _id: email, "likedSongs.songid": songId },
        { $pull: { likedSongs: { songid: songId } } }
      );

      if (removed.modifiedCount === 1) {
        return res.status(200).json({
          status: 200,
          message: "Song removed from liked songs!",
          data: false,
        });
      }

      try {
        await likedSongsCollection.updateOne(
          { _id: email, "likedSongs.songid": { $ne: songId } },
          {
            $push: {
              likedSongs: {
                songid: songId,
                songname: songname,
                picture: picture,
                artist: artist,
              },
            },
          },
          { upsert: true }
        );
        return res.status(200).json({
          status: 200,
          message: "Song added to liked songs!",
          data: true,
        });
      } catch (err) {
        if (err.code !== 11000) {
          throw err;
        }
      }
    }

    return res
      .status(409)
      .json({ status: 409, message: "Song is being updated, try again" });
  } catch (err) {
    return res.status(500).json({ status: 500, message: err.message });
  } finally {
    client.close();
  }
};

//create Playlist
//a POST endpoint that creates a playlist, needs the playlist's name and the user's email to create.
//It can also add songs to the either newly created playlist, or to a different playlist
//using mongoDB's upsert function
const createPlaylist = async (req, res) => {
  const { email, playlist, songName, artistName, songId, picture } = req.body; // only playlist name & email is required
  const client = new MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("finalbpm");

  await db
    .collection("playlist")
    .updateOne(
      { _id: email },
      { $setOnInsert: { _id: email, playlists: [] } },
      { upsert: true }
    );

  const playlistsUpdateResult = await db.collection("playlist").updateOne(
    { _id: email, "playlists.playlistname": playlist },
    {
      $addToSet: {
        "playlists.$.songs": { songName, artistName, songId, picture },
      },
    }
  );

  if (playlistsUpdateResult.modifiedCount === 1) {
    client.close();

    res.status(200).json({ message: "Song added to playlist" });
  } else if (playlistsUpdateResult.matchedCount === 0) {
    const addPlaylistResult = await db.collection("playlist").updateOne(
      { _id: email },
      {
        $push: {
          playlists: {
            playlistname: playlist,
            songs: songName ? [{ songName, artistName, songId, picture }] : [],
          },
        },
      }
    );
    if (addPlaylistResult.modifiedCount === 1) {
      client.close();

      res.status(200).json({ message: "Song added to new playlist" });
    } else {
      client.close();
      res.status(500).json({ message: "Failed to add song to playlist" });
    }
  } else {
    client.close();
    res.status(500).json({ message: "Failed to add song to playlist" });
  }
};

//get all user's playlist
//A simple GET to the database that gives back the user's playlist(s)
const getUserPlaylist = async (req, res) => {
  const { email } = req.params;
  const client = new MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("finalbpm");
  const findUser = await db.collection("playlist").findOne({ _id: email });
  client.close();
  findUser
    ? res
        .status(200)
        .json({ status: 200, message: "User's playlist", data: findUser })
    : res.status(400).json({
        status: 400,
        message: "User not found or no playlists were created yet..",
      });
};
//get specific Song
//Simple GET to the database to  get a single of the user's liked songs
const getUserLikedSong = async (req, res) => {
  const { songid } = req.params;
  const client = new MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("finalbpm");
  const user = await db
    .collection("likesongs")
    .findOne({ "likedSongs.songid": Number(songid) });
  client.close();

  if (user) {
    const likedSong = user.likedSongs.find(
      (song) => song.songid === Number(songid)
    );
    return res
      .status(200)
      .json({ status: 200, message: "Song found", data: likedSong });
  } else {
    return res.status(200).json({ status: 200, message: "Song not liked" });
  }
};

//all songs liked by user
//Simple GET to the database to  get all of the user's liked songs
const getAllUserLikedSongs = async (req, res) => {
  const { email } = req.params;
  const client = new MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("finalbpm");
  const findAllLikedSongs = await db
    .collection("likesongs")
    .find({ _id: email })
    .toArray();

  client.close();

  findAllLikedSongs
    ? res.status(200).json({
        status: 200,
        message: "All Liked songs by user",
        data: findAllLikedSongs,
      })
    : res.status(404).json({ status: 404, message: "No liked songs found." });
};
//create Comment on song
//POST that gets sent to the database, requires the songid, the comment and the user's email to be valid

const createCommentOnSong = async (req, res) => {
  const { songid, comment, email } = req.body;
  const client = new MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("finalbpm");

  const emailTrimmer = email.split("@")[0].toString();

  const newComment = {
    _id: emailTrimmer,
    comment,
  };

  await db
    .collection("comments")
    .updateOne(
      { _id: Number(songid) },
      { $push: { comments: newComment } },
      { upsert: true }
    );

  client.close();

  res.status(201).json({ message: "Comment created successfully" });
};

//Get all comments on a song
//Returns all of the comments on the song based on it's song id, directly connected to the database.
const getAllCommentsOnSong = async (req, res) => {
  const { songid } = req.params;
  const client = new MongoClient(MONGO_URI, options);
  await client.connect();
  const db = client.db("finalbpm");
  const findAllComments = await db
    .collection("comments")
    .findOne({ _id: Number(songid) });

  client.close();

  findAllComments
    ? res.status(200).json({
        status: 200,
        message: "All comments on song ",
        data: findAllComments,
      })
    : res.status(200).json({ status: 200, message: "No song comments found" });
};

module.exports = {
  likeSong,
  createPlaylist,
  getUserLikedSong,
  getAllUserLikedSongs,
  getUserPlaylist,
  getAllCommentsOnSong,
  createCommentOnSong,
};
