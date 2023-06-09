import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import ArtistSpecificInfo from "./ArtistSpecificInfo";
import PageLoad from "../../PageLoad";

const ArtistMain = () => {
  const { artistId } = useParams();
  const [artistInfo, setArtistInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 10;

  useEffect(() => {
    fetch(`/deezerapi/artist/${artistId}`)
      .then((res) => res.json())
      .then((data) => {
        setArtistInfo(data.data);
        setLoading(false);
      });
  }, []);
  //Page Logic/Divide/button count/Similar to search
  const pageCount = artistInfo ? Math.ceil(artistInfo.length / PAGE_SIZE) : 0;
  const paginatedTracks = artistInfo
    ? artistInfo.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : [];

  if (loading) return <PageLoad />;

  return (
    <StyledContainer>
      <StyledTitle>Top 50 tracks by {artistInfo[0].artist.name}</StyledTitle>
      <TrackContainer>
        {paginatedTracks.map((e) => {
          return (
            <ArtistSpecificInfo
              key={e.id}
              title={e.title}
              id={e.id}
              album={e.album}
            />
          );
        })}
      </TrackContainer>
      <PaginationContainer>
        <PaginationButton
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </PaginationButton>
        <PaginationText>
          Page {currentPage} of {pageCount}
        </PaginationText>
        <PaginationButton
          disabled={currentPage === pageCount}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </PaginationButton>
      </PaginationContainer>
    </StyledContainer>
  );
};

export default ArtistMain;

const StyledContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: black;
  color: white;
  border: 2px solid #9d00ff;
  border-radius: 8px;
  width: 50%;
  height: 50%;
  overflow: auto;
  @media (max-width: 375px) {
    height: 600px;
    width: 290px;
    left: 56%;
  }
  @media (max-width: 966px) and (min-width: 701px) {
    height: 700px;
  }
  @media (max-width: 700px) and (min-width: 376px) {
    height: 700px;
    width: 320px;
    left: 56%;
  }
`;

const StyledTitle = styled.h1`
  text-align: center;
  padding: 5px;
  font-size: 35px;
  @media (max-width: 375px) {
    font-size: 25px;
  }
`;

const TrackContainer = styled.div`
  margin-right: 5px;
  margin-left: 5px;
  margin-bottom: 5px;
  display: grid;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 966px) {
    grid-template-columns: 1fr;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PaginationButton = styled.button`
  background-color: #9d00ff;
  color: black;
  border: none;
  border-radius: 8px;
  padding: 5px;
  margin: 10px;
  cursor: pointer;

  &:disabled {
    background-color: #d3d3d3;
    cursor: default;
  }
`;

const PaginationText = styled.span`
  margin: 10px;
  font-size: 20px;
`;
