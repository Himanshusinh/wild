"use client";
import React, { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { loadHistory } from '@/store/slices/historySlice';
import InputBox from './compo/InputBox';

const Page = () => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(loadHistory({ filters: { generationType: 'mockup-generation' } }));
	}, [dispatch]);

	return <InputBox />;
};

export default Page;