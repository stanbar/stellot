import React from "react";
import { ConnectProps } from "@/models/connect";
import Voting from '@/types/voting';
import { TitleParagraph } from "@/pages";
import VotingsTable from "@/components/VotingsTable";

interface WallProps extends ConnectProps {
  votes: Voting[]
}

const Wall: React.FC<WallProps> = () => (
    <div>
      <TitleParagraph>Explore</TitleParagraph>
      <VotingsTable/>
    </div>
  )
;
export default Wall;
