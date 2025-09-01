"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "../../../../lib/utils";

type Card = {
  id: number;
  content: React.ReactNode;
  className: string;
  thumbnail: string;
  title?: string;
};

export const LayoutGrid = ({ cards }: { cards: Card[] }) => {
  const [selected, setSelected] = useState<Card | null>(null);
  const [lastSelected, setLastSelected] = useState<Card | null>(null);

  const handleClick = (card: Card) => {
    setLastSelected(selected);
    setSelected(card);
  };

  const handleOutsideClick = () => {
    setLastSelected(selected);
    setSelected(null);
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto gap-4 md:gap-3 lg:gap-4 relative">
      {cards.map((card, i) => (
        <div key={i} className={cn(card.className, "")}>
          <motion.div
            onClick={() => handleClick(card)}
            className={cn(
              card.className,
              "relative overflow-hidden",
              selected?.id === card.id
                ? "rounded-lg cursor-pointer absolute inset-0 h-1/2 w-full md:w-1/2 m-auto z-50 flex justify-center items-center flex-wrap flex-col"
                : lastSelected?.id === card.id
                ? "z-40 bg-white rounded-xl h-full w-full min-h-[16rem] md:min-h-[20rem]"
                : "bg-white rounded-xl h-full w-full min-h-[16rem] md:min-h-[18rem] lg:min-h-[20rem]"
            )}
            layoutId={`card-${card.id}`}
          >
            {selected?.id === card.id && <SelectedCard selected={selected} />}
            <ImageComponent card={card} />
            {selected?.id !== card.id && (
              <>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-none">
                  {card.title && (
                    <div className="text-white text-2xl md:text-xl lg:text-2xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                      {card.title}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      ))}
      <motion.div
        onClick={handleOutsideClick}
        className={cn(
          "fixed inset-0 bg-black opacity-0 z-40",
          selected?.id ? "pointer-events-auto" : "pointer-events-none"
        )}
        animate={{ opacity: selected?.id ? 0.3 : 0 }}
      />
    </div>
  );
};

const ImageComponent = ({ card }: { card: Card }) => {
  if (!card.thumbnail) {
    return (
      <div className="absolute inset-0 h-full w-full bg-gray-800 flex items-center justify-center">
        <span className="text-gray-400">Image not available</span>
      </div>
    );
  }
  
  return (
    <motion.img
      layoutId={`image-${card.id}-image`}
      src={card.thumbnail}
      height="500"
      width="500"
      className={cn(
        "object-cover object-top absolute inset-0 h-full w-full transition duration-200"
      )}
      alt="thumbnail"
    />
  );
};

const SelectedCard = ({ selected }: { selected: Card | null }) => {
  return (
    <div className="bg-transparent h-full w-full flex flex-col justify-end rounded-lg shadow-2xl relative z-[60]">
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 0.6,
        }}
        className="absolute inset-0 h-full w-full bg-black opacity-60 z-10"
      />
      <motion.div
        layoutId={`content-${selected?.id}`}
        initial={{
          opacity: 0,
          y: 100,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 100,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="relative px-8 md:px-6 lg:px-8 pb-4 md:pb-3 lg:pb-4 z-[70]"
      >
        {selected?.content}
      </motion.div>
    </div>
  );
};
