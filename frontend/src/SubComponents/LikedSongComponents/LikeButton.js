import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { AiFillLike } from "react-icons/ai";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams } from "react-router-dom";
import ToastNotification from "../ToastNotification";

const LikeButton = ({ songname, picture, artist }) => {
  const { user } = useAuth0();
  const { songId } = useParams();
  const [likedSong, setLikedSong] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/songinfo/${songId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setLikedSong(true);
        } else {
          setLikedSong(false);
        }
      });
  }, [songId]);

  const addToLikeList = () => {
    if (!user) {
      return setSignedIn(true);
    } else if (saving) {
      //Ignore clicks until the previous like/unlike has finished
      return;
    } else {
      setSaving(true);
      setLikedSong((prev) => !prev);
      setSignedIn(false);
      fetch("/likesong", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          songid: songId,
          songname: songname,
          picture: picture,
          artist: artist,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (typeof data.data === "boolean") {
            setLikedSong(data.data);
          } else {
            //Request failed, undo the optimistic toggle
            setLikedSong((prev) => !prev);
          }
        })
        .catch((error) => {
          setLikedSong((prev) => !prev);
          window.alert(error, "Something bad happened");
        })
        .finally(() => setSaving(false));
    }
  };

  return (
    <AddToLikedButton onClick={() => addToLikeList()} disabled={saving}>
      <ToastNotification
        message="Please log-in to like the song"
        show={signedIn}
        setShow={setSignedIn}
      />
      <StyledLikeButton likedsong={likedSong ? "true" : ""} />
    </AddToLikedButton>
  );
};

export default LikeButton;

const AddToLikedButton = styled.button`
  margin-left: 15px;
`;

const StyledLikeButton = styled(AiFillLike)`
  color: ${({ likedsong }) => (likedsong ? "#9d00ff" : "white")};
  font-size: 30px;
`;
