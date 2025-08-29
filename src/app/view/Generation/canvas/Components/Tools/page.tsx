'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ToolbarItem from './compo/ToolbarItem';

interface ToolbarItemData {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const Tools: React.FC<{ onToolSelect?: (toolId: string | null) => void }> = ({ onToolSelect }) => {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toolbarItems: ToolbarItemData[] = [
    { 
      id: 'Selection Tool', 
      name: 'Selection Tool', 
      icon: <Image src="/icons/cursor.png" alt="Selection Tool" width={24} height={24} />
    },
    { 
      id: 'Change Object', 
      name: 'Change Object', 
      icon: <Image src="/icons/change.png" alt="Change Object" width={24} height={24} />
    },
    { 
      id: 'Colour Grade', 
      name: 'Colour Grade', 
      icon: <Image src="/icons/colour.png" alt="Colour Grade" width={24} height={24} />
    },
    { 
      id: 'Relight', 
      name: 'Relight', 
      icon: <Image src="/icons/light.png" alt="Relight" width={24} height={24} />
    },
    { 
      id: 'FacialExpression', 
      name: 'Change Facial Expression', 
      icon: <Image src="/icons/facewhite.png" alt="Change Facial Expression" width={24} height={24} />
    },
    // { 
    //   id: 'Remove Object', 
    //   name: 'Remove Object', 
    //   icon: <Image src="/icons/eraser.png" alt="Remove Object" width={24} height={24} />
    // },
    { 
      id: 'Upscale', 
      name: 'Upscale Image', 
      icon: <Image src="/icons/upscalewhite.png" alt="Upscale Image" width={24} height={24} />
    },
    { 
      id: 'Expand', 
      name: 'Expand Image', 
      icon: <Image src="/icons/expandwhite.png" alt="Expand Image" width={24} height={24} />
    }
    // { 
    //   id: 'Merge', 
    //   name: 'Merge Images', 
    //   icon: <Image src="/icons/mergewhite.png" alt="Expand Image" width={24} height={24} />
    // }
  ];

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId);
    onToolSelect?.(toolId);
  };

  return (
    <div 
      className="fixed left-2 top-1/2 transform -translate-y-1/2 z-[50] flex flex-col gap-4"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Cursor Tool Box */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-2">
        <ToolbarItem
          id={toolbarItems[0].id}
          name={toolbarItems[0].name}
          icon={toolbarItems[0].icon}
          isSelected={selectedTool === toolbarItems[0].id}
          isExpanded={isExpanded}
          onClick={() => handleToolClick(toolbarItems[0].id)}
        />
      </div>

      {/* AI Tools Box */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-2">
        <div className="flex flex-col items-center gap-3">
          {toolbarItems.slice(1).map((item) => (
            <ToolbarItem
              key={item.id}
              id={item.id}
              name={item.name}
              icon={item.icon}
              isSelected={selectedTool === item.id}
              isExpanded={isExpanded}
              onClick={() => handleToolClick(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;