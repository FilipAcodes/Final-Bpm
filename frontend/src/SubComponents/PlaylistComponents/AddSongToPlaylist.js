import React, { useState } from "react";
import styled from "styled-components";
import ToastNotification from "../ToastNotification";
import Loading from "../../components/Loading";

const AddSongToPlaylist = ({
  id,
  songname,
  artist,
  picture,
  playlist,
  email,
  closeModal,
}) => {
  const [toast, setToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const addSong = () => {
    setLoading(true);
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        playlist: playlist,
        songName: songname,
        artistName: artist,
        songId: id,
        picture: picture,
      }),
    };
    fetch("/addplaylist", options)
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        setToast(true);
      });
  };
  return (
    <>
      <AddSongButton onClick={addSong} disabled={loading}>
        {loading ? <Loading /> : "Add my song!"}
      </AddSongButton>
      <ToastNotification
        message="Song successfully added!"
        show={toast}
        setShow={setToast}
        closeModal={closeModal}
      />
    </>
  );
};

export default AddSongToPlaylist;

const AddSongButton = styled.button`
  color: white;
  border: 2px solid pink;
  border-radius: 8px;
  cursor: pointer;
`;
