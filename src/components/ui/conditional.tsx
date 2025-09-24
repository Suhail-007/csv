import {  PropsWithChildren } from 'react';

const Conditional = ({ condition, children }: PropsWithChildren<{ condition: boolean }>) => {


  if (!condition) return null;

  return children;
};

export default Conditional;
