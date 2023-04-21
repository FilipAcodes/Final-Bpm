import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AlbumDetails from "./AlbumDetails";
import styled from "styled-components";

const AlbumMain = () => {
  const { albumId } = useParams();
  const [albumInfo, setalbumInfo] = useState(null);
  const [getAlbumInfo, setgetAlbumInfo] = useState(null);

  useEffect(() => {
    fetch(`/deezerapi/album/${albumId}`)
      .then((res) => res.json())
      .then((data) => {
        setalbumInfo(data.data);
        return fetch(`/deezerapi/search/${data.data[0].title}`);
      })
      .then((res) => res.json())
      .then((data) => setgetAlbumInfo(data.data.data[0]));
  }, []);

  return (
    <StyledContainer>
      <ContainerImageTracks>
        {getAlbumInfo && (
          <>
            <ArtistName>{getAlbumInfo.artist.name}</ArtistName>
            <AlbumTitle>{getAlbumInfo.album.title}</AlbumTitle>
            <img src={getAlbumInfo.album.cover_medium} alt="album"></img>
          </>
        )}
      </ContainerImageTracks>
      <TrackContainer>
        <h2>Album Tracks :</h2>
        <TrackPlacementContainer>
          {albumInfo &&
            albumInfo.map((e) => {
              return <AlbumDetails key={e.id} songid={e.id} title={e.title} />;
            })}
        </TrackPlacementContainer>
      </TrackContainer>
    </StyledContainer>
  );
};

export default AlbumMain;

const StyledContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: black;
  color: white;
  border: 2px solid #9d00ff;
  border-radius: 8px;
  width: 60%;
  height: 60%;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  @media (max-width: 375px) {
    height: 600px;
    width: 290px;
    left: 56%;
  }
  @media (max-width: 966px) and (min-width: 376px) {
    height: 700px;
  }
`;

const ContainerImageTracks = styled.div`
  img {
    width: 100%;
    height: 60%;
    object-fit: contain;
  }
`;

const TrackContainer = styled.div`
  overflow: auto;
  margin-top: 5px;
  height: 500px;
`;

const ArtistName = styled.h1`
  text-align: center;
  font-size: 35px;
  margin-top: 5px;
`;

const AlbumTitle = styled.h2`
  text-align: center;
`;

const TrackPlacementContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;
