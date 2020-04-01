import Option from './option';

export default interface Poll {
  question: string;
  options: Option[];
}
