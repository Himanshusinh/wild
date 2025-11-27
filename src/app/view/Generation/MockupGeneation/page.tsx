"use client";
import React from 'react';
import InputBox from './compo/InputBox';

// History is self-managed inside InputBox (single initial fetch + IO pagination)
const Page = () => {
  return <InputBox />;
};

export default Page;