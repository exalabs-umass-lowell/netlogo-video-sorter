import React, { useState, useEffect, useRef, useCallback } from "react";
import { CSS } from '@dnd-kit/utilities';

import { 
  Button, 
  Typography, 
  Container, 
  Box, 
  Paper,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  CircularProgress,
  Collapse,
  ExpandMore,
  Accordion, AccordionActions, AccordionSummary, AccordionDetails,
  IconButton, IconButtonProps,
  Fade,
} from '@mui/material';
import { styled } from '@mui/system';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Draggable from 'react-draggable';
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/roboto/400.css";
import * as XLSX from "xlsx";

// external variables



// --- 1. UTILITIES ---

// --- 2. STYLED COMPONENTS ---

// --- 3. GROUPING COMPONENT ---

// --- 4. ITEMS ---

// --- VIDEO CARD ---
function VideoCard({ index, item }) {
   const [expanded, setExpanded] = useState(false);  
   const src = item.id;
   const [vision, minsep, maxalignturn, maxcohereturn, maxsepturn, pop, desc] = extractDescription(src);
   return (
       <Box sx={{
            background: `linear-gradient(rgba(77,106,255,0.6), rgba(102,102,255,0.6))`, 
            border: '5px solid #004080',
            borderRadius: '5%',
            display: 'inline-block',
            width:'260px',
            //height:'',
            flex: "0 0 auto",
            justifyContent:'center',
            alignItems: 'center',
       }}>
            <Box sx={{ borderRadius: '5%', border: '10px solid rgba(128, 170, 255, 0.5)'}}>
            <img src={`${process.env.PUBLIC_URL}/${src}`}
               controls
               style={{ width: "100%", height: "320px", objectFit: "cover", borderRadius: 6, gap: '10px 10px', }}
            />
            </Box>
            <Box sx={{ display: 'flex', borderRadius: '5%', justifyContent: 'flex-end', alignItems: 'center', }}>
               <Accordion sx={{ display: 'flex', width: '100%', }}>
                  <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1-content"
                      id="${item.id}"
                      
                  >
                      <Typography component="span">{item.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                      <Typography style={{ margin: '10px', fontSize:'10px', color: "#000", fontFamily: "Inter, Montserrat", }}><pre>{desc}</pre></Typography>
                  </AccordionDetails>
               </Accordion >

            </Box>
               
       </Box>
   );
};

const extractDescription = (name) => {
    //console.log("extracting description from "+name);
    if (!name) return "";

    const attrs = name.split('_');
    const dateStr = attrs[0].split("/")[(attrs[0].split("/")).length - 1]; 
    //console.log("Date: ", {dateStr})

    // Split date parts: "111407.893-PM-25-Aug-2025"
    const [timePart, period, day, monthStr, year] = dateStr.split("-");
    const [hhmmss, ms] = timePart.split(".");
    let hours = parseInt(hhmmss.slice(0, 2));
    const minutes = parseInt(hhmmss.slice(2, 4));
    const seconds = parseInt(hhmmss.slice(4, 6));
    const milliseconds = parseInt(ms);
    //console.log(hours, minutes, seconds, milliseconds);
    
    // Convert to 24-hour format
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    // Parse date
    const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    const month = months[monthStr];
    const date = new Date(year, month, day, hours, minutes, seconds, milliseconds);
    //console.log("month and date: ", month, date);
    const pad = (n) => n.toString().padStart(2, '0');
    const formattedDate = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear().toString().slice(-2)}`;
    //console.log("formatted date: ", {formattedDate});

    // get all parameters safely
    const vision = attrs[1]?.split('=')[1] || '?';
    const minsep = attrs[2]?.split('=')[1] || '?';
    const maxalignturn = attrs[3]?.split('=')[1] || '?';
    const maxcohereturn = attrs[4]?.split('=')[1] || '?';
    const maxsepturn = attrs[5]?.split('=')[1] || '?';
    const population = attrs[6]?.split('=')[1] || '?';
    const pop = population.split(".")[0];

    const desc = 
    `Date taken: ${formattedDate}
Vision: ${vision}
Minimum separation: ${minsep}
Maximum alignment turn: ${maxalignturn}
Maximum coherence turn: ${maxcohereturn}
Maximum separation turn: ${maxsepturn}
Population: ${pop}`;
    
    return [vision, minsep, maxalignturn, maxcohereturn, maxsepturn, pop, String(desc)];
};


// --- DRAGGABLE ---
/* What can be dragged into different groups created by users
 * These can be video cards, but can accommodate other things 
 */  
function Drag({ item, set, areas, moveItem, children }) {
  const [dragging, setDragging] = useState(false);  // see if object is being dragged
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: "100%", height: "100%" }); // maintain size throughout each container
  const boxRef = useRef(0); // get reference for box to determine when to resize
  const onStart = () => { 
     setDragging(true);
     document.addEventListener('mousedown', (e) => {
        const x = e.clientX ;//- rect.left;
        const y = e.clientY; //- rect.top;
        console.log(x, y);              
     });
    if (boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
  };

  const onDrag = (videoID, moveItem, e) => { // changing the video's current set from one to another
     // setID: ID of set video is in
     // videoID: ID of video
     // data: get the location of the mouse while dragging video
     // e: event
     const x = e.clientX;
     const y = e.clientY;
     // find which droppable the drag is in 
     const targetDroppable = areas.find(area =>  
        x <= area.right &&
        x >= area.left &&
        y >= area.top &&
        y <= area.bottom
     );
     for (var i=0; i<areas.length; i++) {
        console.log("area: ", areas[i].left, areas[i].right, x, areas[i].bottom, areas[i].top, y);
     }
     console.log("targetDroppable: ", targetDroppable);
  };

  const onStop = (e) => {
     setDragging(false);
     const x = e.clientX;
     const y = e.clientY;
     for (var i=0; i<areas.length; i++) {
        console.log("area: ", areas[i]);
     }
     const targetDroppable = areas.find(area =>  {
        const rect = area.el.getBoundingClientRect();
        return (
        x <= rect.right &&
        x >= rect.left &&
        y >= rect.top &&
        y <= rect.bottom
        );
     });
     if (!targetDroppable) return;
     console.log(x, targetDroppable.left, targetDroppable.right);
     console.log(y, targetDroppable.bottom, targetDroppable.top);
     console.log("targetDroppable: ", targetDroppable);
     moveItem(item, set, targetDroppable.id);
     if (boxRef.current) {
       setSize({ width: "100%", height: "100%" });
     }
     setPosition({ x: 0, y: 0 });
  };

  return (
      <Draggable
         axis="both"
         defaultPosition={{x: 0, y: 0}}
         position={position}
         grid={[25, 25]}
         scale={1}
         onStart={onStart}
         onDrag={(e, data) => {
           setPosition({ x: data.x, y: data.y });
         }}
         onStop={ onStop }>
         <Box ref={boxRef} sx={{ width: dragging ? `${size.width}px` : "300px", height: dragging ? `${size.height}px` : "100%", boxSizing: 'border-box', padding: 1, border: '10px solid rgba(0, 119, 179, 0.5)', borderRadius: '5%', }}>

            {children}
         </Box> 
      </Draggable>
  );
}

// --- DROPPABLE --- 
/* These are where draggables can be placed in
 * Mainly for sets of videos created by users, but can accommodate other things 
 */  
function Droppable({ containerRef, register, id, swarms, areas, moveItem }) {
   const [containerWidth, setContainerWidth] = useState(0);
   const [containerHeight, setContainerHeight] = useState(0);
   const itemRefs = useRef({}); // item refs for drag objects
   useEffect(() => {
      console.log("in useeffect of droppable");
      if (!containerRef.current?.parentElement) return;
      console.log("after containerref checked");
      const containerWidth = containerRef.current.clientWidth;
      let rowWidth = 0;
      let currentRowWidth = 0;
      let rowMaxHeight = 0; 
      let totalHeight = 0; 
      swarms.forEach(item => {
         const ref = itemRefs.current[item.id];
         if (!ref) return;
         const rect = ref.getBoundingClientRect();
         const boxWidth = rect.width + 10;
         const boxHeight = rect.height + 10;
         if (rowWidth + boxWidth > containerWidth){
             totalHeight += rowMaxHeight;
             rowWidth = boxWidth;
             rowMaxHeight = boxHeight;
         } else {
             rowWidth += boxWidth;
             rowMaxHeight = Math.max(rowMaxHeight, boxHeight);
         }
         currentRowWidth = Math.max(currentRowWidth, rowWidth);
      });
      totalHeight += rowMaxHeight;
      setContainerWidth(currentRowWidth);
      setContainerHeight(totalHeight);
      console.log("containerwidth: ", containerWidth);
      console.log("containerheight: ", containerHeight);

   }, [swarms]); // resizing the width of the droppable box based on any new object added in
   
   console.log("swarms is ", Object.entries(swarms));
   console.log("id: ", id);
//width: containerWidth ? `${containerWidth}px` : "auto", height: containerHeight ? `${containerHeight}px` : "auto",
   return (
     <Box sx={{ display: 'flex', margin: '20px 50px', alignItems: 'flex-start' }}>
      <Box sx={{display: 'flex', alignSelf:"stretch", padding:'10px', borderRadius: "0% 10px 10px 0%", width: '50px', height: "flex", background: 'rgba(128, 170, 255, 0.5)', fontWeight: 'bold', justifyContent: 'center', alignItems: 'center', transform: "rotate(180deg)", writingMode: "vertical-rl", }}>
       <Typography sx={{ color:'#FFF', fontWeight:'bold', fontSize:'20px', }}> SET {id} </Typography>
      </Box>
      <Box ref={element => {
                containerRef.current = element;
                register(id, element);
           }} sx={{ flexWrap: 'wrap', alignItems: 'flex-start', display: 'flex', position: "relative",  padding: 3, gap: 3, boxSizing: 'border-box', minHeight: '500px', margin: '0px', border: '5px dashed rgba(179, 204, 255)', borderRadius: '8px', overflowY: 'visible', overflowX: 'visible',gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', }}>
         {
            (swarms).map((videoID, idx) => (
               <Drag item={videoID} set={id} areas={areas} moveItem={moveItem} >
                   <VideoCard index={idx} item={videoID} />
               </Drag>  
            ))
         }
      </Box>
     </Box>
   );
}

// --- INSTRUCTIONAL CARDS ---

const instructions1_msgs = ["Hello!\nWelcome to the swarm complexity sorting survey!\n",
		{ type: "instruction", textBefore: "Click ", bold: "Next Page", textAfter: " to get to the instructions."}];
const instructions2_msgs = ["You will be presented with a series of videos that you will be asked to rank according to complexity.",
 		"Complexity is defined as the inconsistency of the swarm behavior displayed on the screen.",
		"A series of pairs of videos will be displayed, where one video is more complex than the other. Your task is to select which you think is the most complex.",
		"Once you have selected then you can click submit.",
		"If you are unsure of one or more of your choices, you will be allowed to go back to that pair of videos and re-evaluate.",
		"Click the start button to begin the survey once you have read and understood these instructions. Have fun!"];


function InstructionCard({ psg }) {
   if (typeof psg === "string") {
      return (
         <div style={{ 
           width: '500px', 
           height: 'flex', 
           borderRadius: '10px', 
           margin: '20px', 
           borderColor: '#3399FF', 
           backgroundColor: 'white', 
           color: '#003366', 
           padding: '150px 20px',
         }}>
           {psg}
         </div>
      );
   }
   if (psg.type === "instruction") {
      return (
         <div style={{ 
            width: '500px', 
            height: 'flex', 
            borderRadius: '10px', 
            margin: '20px', 
            borderColor: '#3399FF', 
            backgroundColor: 'white', 
            color: '#003366', 
            padding: '150px 20px',
         }}>
            {psg.textBefore}
            <strong>{psg.bold}</strong>
            {psg.textAfter}
         </div>
      );
   }
} 


function InstructionBoard({ msgs }) { // board to display instructions at start of game
   const [currentInstruction, setCurrentInstruction] = useState(0);
   const next = () => {
      setCurrentInstruction(curr => (curr + 1));
   };
   const prev = () => {
      setCurrentInstruction(curr => (curr - 1));
   };
   return (
      <div style={{ width: '1000px',
                   border: '5px solid #3399FF',
                   borderRadius: '10px',
                   borderColor: '#3399FF',
                   padding: '16px 20px',
                   lineHeight: '1.5',
                   background: 'radial-gradient(circle,#80D4FF,#19B2FF,#3399FF)',
                   display: 'flex',
                   flexDirection: 'column', 
                   gap: '100px', 
                   marginTop: '30px',
                   textAlign: 'center',
                   alignItems: 'center', 
                   justifyContent: 'center', }}>
         <Typography 
           variant="h4"
           sx={{
             fontFamily: `'Orbitron', 'Roboto Mono', 'JetBrains Mono', monospace`,
             fontWeight: 600,
             letterSpacing: '0.18em',
             textTransform: 'uppercase',
             color: '#003366',
             fontWeight: 'bold',
           }}> 
             Instructions 
         </Typography>
         <Fade in timeout={300} key={currentInstruction}>
         <p>< InstructionCard psg={msgs[currentInstruction]} /></p>
         </Fade>
         <div>
           {currentInstruction > 0 && (<Button onClick={prev} sx={{ backgroundColor: '#80D4FF', color: '#000000', '&:hover': { backgroundColor: '#0066FF', color: '#FFFFFF'} }} >Previous</Button>)}
           <Typography sx={{ gap: '20px', fontWeight: 'bold', fontFamily: `'Orbitron', 'Roboto Mono', 'JetBrains Mono', monospace`, }}>
              {(currentInstruction+1)}/{msgs.length}
           </Typography>
           {currentInstruction < msgs.length - 1 && (<Button onClick={next} sx={{ backgroundColor: '#80D4FF', color: '#000000', '&:hover': { backgroundColor: '#0066FF', color: '#FFFFFF'} }} >Next</Button>)}
         </div>
      </div>
   );
}


// --- 5. EMAIL FORM MODAL COMPONENT (Unchanged) ---

// --- 6. MAIN APP COMPONENT ---
function App_noflex() {
  const [items, setItems] = useState([]); // all videos to be sorted
  const [loading, setLoading] = useState(false); // loading videos
  const startTimeRef = useRef(performance.now()); // time reference to record times
  const videoSetRefs = useRef(new Map());
  const containerRef = useRef(null);

  const JSON_FILE_PATH = "${process.env.PUBLIC_URL}/video_paths.json";

  /* page states */
  const [startScreen, setStartScreen] = useState(true);
  const [instructions1, setInstructions1] = useState(false); // on the first set of instructions page
  const [instructions2, setInstructions2] = useState(false); // on the second set of instructions page
  const [started, setStarted] = useState(false); // main survey started
  const [ended, setEnded] = useState(false); // survey ended, now show results
  const [display, setDisplay] = useState(0); // set display 
  const mousePos = useRef({ x : 0, y : 0});
  const [areas, setAreas] = useState([]); // for the boundaries of all droppables
    
  /* animation states */
  const [startScreenSlide, setStartScreenSlide] = useState(false);
  const [endScreenSlide, setEndScreenSlide] = useState(false);

  /* number of video sets */
  const nextSetId = useRef(0);
  const [swarmSets, setSwarmSets] = useState([]);
  const [swarmSetsState, setSwarmSetsState] = useState(swarmSets);
  const [currID, setCurrID] = useState(0);

  const startSet = () => {
      console.log("swarmsets: ", swarmSets);
      nextSetId.current += 1;
      videoSetRefs.current += 1; 
      const ID = nextSetId.current;
      setSwarmSets((prev) => [
            ...prev, 
            {
               id: ID, // number of sets, so the ID increments with each added set, base set is 0
               swarms: []
            }
      ]);
      console.log("swarmset: ", swarmSets[swarmSets.length - 1].id);
  };


  // Build a public URL for a video entry. Assumes video entries in json use paths relative to public/, e.g. "swarm-videos/foo.mp4".
  const makeURL = (id) => {
    // process.env.PUBLIC_URL is set by CRA at build time; during dev it's empty string
    const base = process.env.PUBLIC_URL; // get the current url of the public items for app
    // ensure leading slash if PUBLIC_URL empty
    const prefix = (base === "" ? "" : base); // if prefix is blank, then set prefix equal to blank otherwise equal to base
    return `${prefix}/${id}`.replace("/\/g", "/"); // return the url as "prefix"/"id", with replacing the // with /
  };
  
  useEffect(() => {
    let mounted = true;
    const loadVideos = async() => {
     console.log("swarmsets length: ", swarmSets.length);
     try {
        setLoading(true);
        const call = await fetch(`${process.env.PUBLIC_URL}/video_paths.json`);
        if (!call.ok) console.log("Could not fetch the json.");
        const data = await call.json();
        if (!mounted) return;
        const videoItems = (data.map((it, index) => ({
           ...it,
           idx: index,
           id: it.id || String(index),
           url: makeURL((it.id || String(id)).replace(/^\//, "")),
        })));
        setItems(videoItems);
        setSwarmSets(prev => { 
           if (prev.length === 0) {
              return [...prev, 
                 {
                    id: nextSetId.current,
                    swarms: [...videoItems],
                 },
              ];
           }
           console.log("swarmset: ", prev[prev.length - 1].id);
           return prev;              
        });
     } catch (e) {
        console.log("Error is: "+e);
     } finally {
        setLoading(false); 
     }

    };

    loadVideos();
    return () => {
      mounted = false;
    };
  }, [started]);

  useEffect(() => {
     setTimeout(() => {
        setStartScreenSlide(true);
     }, 500);
  }, [startScreen]);

  useEffect(() => {
     setTimeout(() => {
        setStartScreenSlide(true);
     }, 500);
  }, [ended]);

   function goToNextInstructions() {
       console.log("going to next instructions");
       setInstructions1(false); 
       setInstructions2(false);
       if (instructions2) {
          console.log("instructions2 == true");
       }
       if (!instructions1) {
          console.log("instructions1 == false");
       }
   };

   function goToGame() {
        //setInstructions2(false); 
       setStartScreen(false);
       setStarted(true);
   };

    const registerDroppable = (id, el) => {
      if (el){
        const rect = el.getBoundingClientRect();
        //console.log("el is ", el.offsetWidth, el.offsetHeight, el.offsetLeft, el.offsetTop);
        const bounds = {"X":el.offsetLeft + el.offsetWidth, "Y":el.offsetTop + el.offsetHeight, "W":el.offsetWidth, "H":el.offsetHeight};
        setAreas(prev => {
          if (prev.some(a => a.id === id)) return prev;

          return [
            ...prev,
            { id, el }
          ];
        });
      }
    };

const moveItem = (item, fromId, toId) => {
  if (fromId === toId) return;

  setSwarmSets(prev => { 
    const updated = [...prev]; // get all swarm sets
    console.log("item: ", item);

    const fromIndex = updated.findIndex(swarm => swarm.id === fromId);
    const toIndex = updated.findIndex(swarm => swarm.id === toId);
    console.log("updated fromIndex: ", updated[fromIndex]);
    console.log("updated toIndex: ", updated[toIndex]);

    updated[fromIndex]["swarms"] = updated[fromIndex].swarms.filter(
        swarm => swarm.id !== item.id
    );
    updated[toIndex]["swarms"] = [
      ...updated[toIndex].swarms, 
        {name: item.name, id: item.id, idx: updated[toIndex].swarms.length, url:item.url}
    ];
    
    console.log("source: ", updated[fromIndex]);
    console.log("destination: ", updated[toIndex]);

    return updated;
  });
};

    const submit = () => {
  setStarted(false);
  setEnded(true);
  if (!swarmSets || swarmSets.length === 0) return;

  // Find max number of videos in any set
  const maxLength = Math.max(
    ...swarmSets.map(set => set.swarms.length)
  );

  // Build rows
  const rows = [];

  // Header row (Set names)
  const header = swarmSets.map(set => `SET ${set.id}`);
  rows.push(header);

  // Add video rows
  for (let i = 0; i < maxLength; i++) {
    const row = swarmSets.map(set => {
      return set.swarms[i]?.name || "";   // or .id depending what you want
    });
    rows.push(row);
  }

  // Convert to worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SwarmSets");

  XLSX.writeFile(workbook, "SwarmSets.xlsx");
    };

    return (
      <>
        <Box sx={{
                minHeight: '100vh',
                position: "absolute",
                top: 0, 
                left: 0,
                padding: '0px',
                width: '100%',
                background: `
                   linear-gradient(rgba(59, 0, 173, 0.7), rgba(77, 136, 255, 0.7)), url(${process.env.PUBLIC_URL}/swarm-background.jpg)                
                `,
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                transition: 'background 0.5s ease',
                backgroundSize: 'cover', 
                backgroundPosition: 'center, center, center', 
                backgroundRepeat: 'no-repeat, no-repeat, no-repeat', 
                backgroundBlendMode: 'multiply',
        }}>
        <Box sx={{
                width: '100%',
                height: 'flex',
                display: 'flex',
                backgroundColor: "rgba(0,0,0,0.5)",
                top: 0,
                left: 0,
                zIndex: 1000,
                position: 'absolute',
        }}>
           <Box 
              component="img"
              sx={{height:'60px',alignItems:'center',justifyContent:'center',display:'flex',}}
              src={`${process.env.PUBLIC_URL}/exalabs-logo.png`}
           />
              <Typography sx={{ margin: '10px', fontWeight: 'bold', color: '#FFF', borderLeft: '50px solid rgba(0,0,0,0)', }}> Exalabs UMass Lowell </Typography>
        </Box>
      {startScreen && 
           (<> 
           <Typography sx={{ color: '#FFF', fontWeight: 'bold', fontSize: '75px', margin: '10px', marginBottom: '30px', opacity: startScreenSlide ? 1 : 0, transform: startScreenSlide ? "translateY(0)" : "translateY(-50px)", transition: "opacity 1s ease-out, transform 1s ease-out", justifyContent:'center', textAlign: 'center', fontType: '', }}> Welcome to the swarm complexity survey </Typography>
                <Button sx={{ '&:hover': { color: '#000', backgroundColor: '#D4E3F0', fontSize: '30px', fontWeight: 'bold', }, 'color': '#FFF', backgroundColor: 'rgba(92, 135, 175, 0.5)', fontSize: '30px', fontWeight: 'bold', opacity: startScreenSlide ? 1 : 0, transform: startScreenSlide ? "translateY(0)" : "translateY(50px)", transition: "opacity 1s ease-out, transform 1s ease-out", }} onClick={goToGame}> Start </Button>
           </>)
      } 
      {instructions1 && (<>
           <InstructionBoard msgs={instructions1_msgs}/> 
                <Button sx={{
                    fontSize: '20px',  
                    backgroundColor: '#E6FBFF',
                    color: '#000',
                    padding: '15px',
                    margin: '20px',
                }}
                onClick={goToNextInstructions}> Next Page </Button>
      </>)}           
      {instructions2 && 
                (<>
           <InstructionBoard msgs={instructions2_msgs}/> 
                <Button sx={{
                    fontSize: '20px',  
                    backgroundColor: '#E6FBFF',
                    color: '#000',
                    padding: '15px',
                    margin: '20px',
                }}
                onClick={goToGame}> Start survey! </Button>
       </>)}
       {started && 
           (<>
                  <Box sx={{ 
                       background: '#110066',
                       border: '10px solid #007386',
                       display: 'flex',
                       width: '100%',
                       justifyContent: 'center',
                       alignItems:'center',
                       padding: '10px',
                       position: 'sticky',
                  }}> 
                       <Typography sx={{ fontFamily: "Inter, Montserrat", margin: '20px', fontWeight: 'bold', fontSize: '50px', alignItems: 'center',  color: '#FFF'}}> Swarm Complexity Organizer </Typography>
                  </Box>

                  <Box ref={containerRef} sx={{ width: '100%', height: '100%', alignItems: 'center',}}>
                     <Droppable containerRef={containerRef} register={registerDroppable} id={swarmSets[0]["id"]} swarms={swarmSets[0].swarms} areas={areas} moveItem={moveItem}/>
                  </Box>
                  <Button onClick={startSet} sx={{ margin: '50px', borderColor:'#000833', fontSize: '50px', color: '#000', padding: '20px', backgroundColor: '#0066FF', '&:hover': { backgroundColor: '#000099', color: '#FFFFFF'} }}>
                       New Group
                  </Button>
                  <Button onClick={submit} sx={{ margin: '50px', borderColor:'#000833', fontSize: '50px', color: '#000', padding: '20px', backgroundColor: '#0066FF', '&:hover': { backgroundColor: '#000099', color: '#FFFFFF'} }}>
                       Submit
                  </Button>
                  <Box ref={containerRef}> 
                       {swarmSets.slice(1).map((swarmSet) => (
                            <Droppable containerRef={containerRef} register={registerDroppable} id={swarmSet["id"]} swarms={swarmSets[swarmSet["id"]].swarms} areas={areas} moveItem={moveItem}/>
                       ))}
                  </Box>

             </>)
         }
         {ended && 
             (<>
                 <Box sx={{ 
                       display: 'flex',
                       width: '100%',
                       justifyContent: 'center',
                       alignItems:'center',
                       padding: '10px',
                       position: 'sticky',
                  }}> 
                    <Typography sx={{ fontWeight: 'bold', color: '#FFF', opacity: startScreenSlide ? 1 : 0, transform: ended ? "translateY(0)" : "translateY(-50px)", transition: "opacity 1s ease-out, transform 1s ease-out", justifyContent:'center', textAlign: 'center', fontSize: '30px',}}>
                       Survey complete!
                    </Typography>
                  </Box>
              </>)
         }
  
      </Box></>);
};


export default App_noflex;
