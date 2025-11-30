/* eslint-disable react/no-array-index-key */

/* eslint-disable no-use-before-define */

/* eslint-disable consistent-return */

import { cn } from "@/lib/utils";

import * as React from "react";



export function useMediaValues(

  medias: number[] | undefined,

  columns: [number, ...number[]],

  gap: [number, ...number[]]

): { columns: number; gap: number } {

  const [values, setValues] = React.useState({ columns: 0, gap: 0 });



  React.useEffect(() => {

    if (medias === undefined) {

      setValues({ columns: columns[0], gap: gap[0] });

      return;

    }



    const mediaQueries = medias.map((media) => window.matchMedia(`(min-width: ${media}px)`));



    function onSizeChange(): void {

      let matches = 0;



      mediaQueries.forEach((mediaQuery) => {

        if (mediaQuery.matches) {

          matches += 1;

        }

      });



      // Update Values

      const idx = Math.min(mediaQueries.length - 1, Math.max(0, matches));

      setValues({ columns: columns[idx]!, gap: gap[idx]! });

    }



    // Initial Call

    onSizeChange();



    // Apply Listeners

    for (const mediaQuery of mediaQueries) {

      mediaQuery.addEventListener("change", onSizeChange);

    }



    return () => {

      for (const mediaQuery of mediaQueries) {

        mediaQuery.removeEventListener("change", onSizeChange);

      }

    };

  }, [medias, columns, gap]);



  return values;

}



export type MasonryProps<T> = React.ComponentPropsWithoutRef<"div"> & {

  items: T[];

  render: (item: T, idx: number) => React.ReactNode;

  config: {

    columns: number | [number, ...number[]];

    gap: number | [number, ...number[]];

    media?: number[];

  };

  placeholder?: React.ReactElement;

};



export function createSafeArray(data: number | [number, ...number[]]): [number, ...number[]] {

  if (Array.isArray(data)) {

    return data.length > 0 ? [data[0], ...data.slice(1)] : [0];

  }

  return [data];

}



export function Masonry<T>({

  items = [],

  render,

  placeholder,

  config,

  ...rest

}: MasonryProps<T>): React.ReactElement {

  const { columns, gap } = useMediaValues(

    config.media,

    createSafeArray(config.columns),

    createSafeArray(config.gap)

  );

  const isLayoutReady = columns !== 0;

  if (!isLayoutReady && placeholder !== undefined) {

    return placeholder;

  }



  const chunks = createChunks<T>(items, columns);

  const dataColumns = createDataColumns<T>(chunks, columns);



  return (

    <div

      {...rest}

      className={cn("grid items-start", {

        "grid-cols-1": columns === 1,

        "grid-cols-2": columns === 2,

        "grid-cols-3": columns === 3,

        "grid-cols-4": columns === 4,

        "grid-cols-5": columns === 5,

      })}

      style={{ columnGap: `${gap}px` }}

    >

      {dataColumns.map((column, idx) => (

        <MasonryRow gap={gap} key={idx}>

          {column.map((item, jdx) => render(item, jdx))}

        </MasonryRow>

      ))}

    </div>

  );

}



export function MasonryRow({

  children,

  gap,

}: {

  children: React.ReactNode;

  gap: number;

}): React.ReactElement {

  return (

    <div

      style={{

        display: "grid",

        rowGap: gap,

        gridTemplateColumns: "minmax(0, 1fr)",

      }}

    >

      {children}

    </div>

  );

}



export function createChunks<T>(data: T[] = [], columns = 3): T[][] {

  const result = [];



  for (let idx = 0; idx < data.length; idx += columns) {

    const slice = data.slice(idx, idx + columns);

    result.push(slice);

  }



  return result;

}



export function createDataColumns<T>(data: T[][] = [], columns = 3): T[][] {

  const result = Array.from<T[], T[]>({ length: columns }, () => []);



  for (let idx = 0; idx < columns; idx++) {

    for (const row of data) {

      if (row?.[idx] !== undefined) {

        result[idx]?.push(row[idx]!);

      }

    }

  }



  return result;

}

