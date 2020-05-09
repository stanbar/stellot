import React from 'react';
import { TitleParagraph } from '..';
import VotingsTable from '@/components/VotingsTable';

interface VotesProps {
}

const Votes: React.FC<VotesProps> = () => (
  <div>
      <TitleParagraph>Explore public votings</TitleParagraph>
      <VotingsTable/>
  </div>
);

export default Votes;
