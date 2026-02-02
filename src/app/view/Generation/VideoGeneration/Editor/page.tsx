'use client';

import React from 'react';
import VideoEditor from './components/VideoEditor';
import './animations.css';

export default function EditorPage() {
    return (
        <div className="w-full h-screen bg-black">
            <VideoEditor />
        </div>
    );
}
