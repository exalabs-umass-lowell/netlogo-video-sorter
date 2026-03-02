import React, { useEffect, useState, useCallback, useRef } from "react";
import {   Button, 
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
  IconButton, IconButtonProps,
  Fade } from '@mui/material';
import { AnimatedBackground, useAnimationControls } from 'animated-backgrounds';
import { styled } from '@mui/system';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import emailjs from 'emailjs-com';
import { keyframes } from "@mui/system";
import axios from "axios";

// VideoPairApp.jsx
let rankedVideos = {};
let selectionTimes = {};
let notSelectionTimes = {};
let resultsFile = "";
let resultsName = "";

export default function VideoPairApp_simple() {
  // CSS components
  const body = {
    height: "100%",
    width: "100%",
    border: "10px solid transparent",
    borderImage: "url(https://vultimate1.github.io/grid-electronics.png)",
    borderImageRepeat: "round",
    transition: "background-color 0.8s ease",
    boxSizing: "border-box",
  };

  // states
  const [startInstructions, setStartInstructions] = useState([]); // reading the opening instructions
  const [preSurvey, setPreSurvey] = useState([]); // reading the pre-survey instructions
  const [initSurvey, setInitSurvey] = useState();
  const startedSurvey = useRef(false); // determine when to start main survey
  const [items, setItems] = useState([]); // full list loaded from JSON
  const [loading, setLoading] = useState(true); // is the data loading
  const [startvid, setStartvid] = useState(""); // set the starting video
  const [behavior, setBehavior] = useState(""); // set the behavior to be used in the video
  const [surveyVids, setSurveyVids] = useState([]); // setting the videos to be used in the survey
  const [pool, setPool] = useState([]); // shuffled remaining items
  const [pair, setPair] = useState([]); // current pair of two items
  const [current, setCurrent] = useState([]); // setting the chosen video
  const [current_video_pair, set_current_video_pair] = useState({}); // setting the pair of videos the survey is on
  const [current_video_names, set_current_video_names] = useState({}); // getting the names of the videos in the current pair
  const [chosenVids, setChosenVids] = useState([]);
  const [notChosenVids, setNotChosenVids] = useState([]);  
  const [results, setResults] = useState([]); // recorded choices: {left, right, chosenId}
  const [ended, setEnded] = useState(false); // has the survey been completed?
  const [start, setStart] = useState(() => performance.now()); // is the survey starting?
  const [choiceTime, setChoiceTime] = useState(0); // what is the start time?
  const [times, setTimes] = useState([]); // array for the times taken by each user
  const [vidnum, setVidnum] = useState(1); // increment number of videos seen
  const [vid_indices, set_vid_indices] = useState([]); // indices of each video
  const [rankings, setRankings] = useState([]); // ordered ranked videos after the survey
  const [display, setDisplay] = useState(0); // choose which results to display: rankings or the times
  const [numChanges, setNumChanges] = useState(0); // this is used to determine which results to display
  
  const [titleFloat, setTitleFloat] = useState(false); // for floating animation for a header
useEffect(() => {
  const timer = setTimeout(() => {
    setTitleFloat(true);
  }, 50); // small delay ensures first render happens at opacity 0

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  setVisible(false);
  setTimeout(() => {
    setVisible(true);
  }, 500);

}, [startInstructions]);

useEffect(() => {
  setTitleFloat(false);
  setTimeout(() => {
    setTitleFloat(true);
  }, 1000);

}, [display]);


  var text = ""; // display text at the end
  const startTimeRef = useRef(performance.now());
 
  /* Sequence of events
  1. loadVideos();
  2. startSurvey();
  3. 
  */

  useEffect(() => {
     setTimeout(() => {
     if (!startvid) return;
     console.log("starting video is " +startvid);
     }, 1000);
  }, [startvid]);


  // Utility: shuffle array (Fisher-Yates)
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    console.log("shuffled first: id:"+String(a[0].id)+", name: "+String(a[0].name));
    return a;
  };

  
  // Build a public URL for a video entry. Assumes video entries in json use paths relative to public/, e.g. "swarm-videos/foo.mp4".
  const makeUrl = (id) => {
    // process.env.PUBLIC_URL is set by CRA at build time; during dev it's empty string
    const base = process.env.PUBLIC_URL;
    // ensure leading slash if PUBLIC_URL empty
    const prefix = base === "" ? "" : base;
    return `${prefix}/${id}`.replace("/\/g", "/");
  };

  function indexExcluding(arr_len, index) {
    if (arr_len <= 1) return null;
    const indices = [];
    for (var i=0; i<arr_len; i++) {
      if (i!=index) {
        indices.push(i);
      }
    }
    console.log("what are indices? "+String(indices));
    set_vid_indices(indices);
  }


const floatFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

  // Load json list from JSON video list

  const loadVideos = async() => {
    let mounted = true;

      try {
        setLoading(true);
        console.log("LOADING");
        const res = await fetch(`${process.env.PUBLIC_URL}/video_paths.json`);
        if (!res.ok) throw new Error("Failed to fetch json-videos.json: " + res.status);
        const data = await res.json();
        if (!mounted) return;
        // Normalize: ensure each item has id and name and url

        setItems(data.map((it, idx) => ({
          ...it,
          _idx: idx,
          id: it.id || String(idx),
          url: makeUrl((it.id || String(idx)).replace(/^\//, "")),
        })));
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    return () => {(mounted = false)};
  };  


useEffect(() => {
  loadVideos();
  startTimeRef.current = performance.now();
  setStart(performance.now());
}, [initSurvey]);

useEffect(() => {
  if (items.length > 0 && !startedSurvey.current) {
    startSurvey(items[0]);
  }
}, [items]);

  function startSurvey(video) {
        /* order each video based on complexity for a selected behavior category */
        // choose swarm behavior
        console.log("IN THE START SURVEY");
        if (startedSurvey.current) return;
        startedSurvey.current = true;
        setBehavior(video.id.split("/")[2]);

        setStartvid(video);
        console.log("behavior is "+String(behavior));
  }

useEffect(() => {
  if (!behavior || !items.length) return;

  const filtered = items.filter(v => v.id.includes(behavior));
  console.log("Filtered survey vids:", filtered.length, filtered);

  if (filtered.length < 2) {
    console.warn("Not enough videos to compare for behavior:", behavior);
    //setSurveyVids([]);
    setEnded(true);
    return;
  }

  setSurveyVids(filtered);
}, [behavior, items]);


useEffect(() => {
  if (surveyVids.length < 2) {
    setPair([]);
    setPool([]);
    setEnded(true);
    return;
  }
  
  const shuffled = shuffle(surveyVids);
  setCurrent(shuffled[0]);
  setPair([shuffled[0], shuffled[1]]);
  setPool(shuffled.slice(2));
  setEnded(false);
  setResults([]);
  setTimes([]);
  setChosenVids([]);
  setNotChosenVids([]);
  setVidnum(1);
}, [surveyVids]);

const [visible, setVisible] = useState(true);

const onChoose = useCallback((chosenSide) => {
  if (!pair || pair.length !== 2) return;

  const now = performance.now();
  const elapsed = (now - startTimeRef.current)/1000;

  const left = pair[0];
  const right = pair[1];
  const chosen = chosenSide === "left" ? left : right;
  const notChosen = chosenSide === "right" ? left : right;

  setResults(r => [...r, { left: left.id, right: right.id, chosen: chosen.id, notChosen: notChosen.id, timestamp: Date.now(), elapsedTime: elapsed }]);
  setTimes(t => [...t, elapsed]); 
  setChosenVids(c => [...c, chosen.id]); 
  setNotChosenVids(n => [...n, notChosen.id]); 
  if (pool.length === 0) {
    setEnded(true);
    setPair([]);
    return;
  }

  const next = pool[0];
  setVisible(false);
  setTimeout(() => {
    setCurrent({ chosen, notChosen, elapsed });
    startTimeRef.current = (performance.now());

    set_current_video_pair({
      chosen,
      notChosen,
      elapsed,
    });
    setPair([chosen, next]);
    setPool(p => p.slice(1));
    setVidnum(v => v + 1);
    setVisible(true);
  }, 500);
  setStart(performance.now());
}, [pair, pool]);

// add current to ranked videos
useEffect(() => {
  if (!current_video_pair) return;
  const {chosen, notChosen, elapsed} = current_video_pair;
  if (!chosen || !notChosen) return;
  console.log("chosen video is "+chosen.id+", "+chosen.name);
  console.log("unchosen video is "+notChosen.id+", "+notChosen.name);
  console.log("times length is "+String(times.length));
  setRankings((prev) => { // ordering from least to most complex
    console.log("number of rankings? "+String(rankings.length));
    const ranking = [...prev];
    // inserting the newly selected video into list of ranked videos
    let chosenVidIndex = ranking.findIndex((v) => v.id == chosen.id);
    let notChosenVidIndex = ranking.findIndex((v) => v.id == notChosen.id);
    if (chosenVidIndex == -1 && notChosenVidIndex != -1){ // if chosen video not in rankings yet
      ranking.splice(notChosenVidIndex-1,0,chosen); 
      chosenVidIndex = ranking.length - 1; // set as back
    } 
    if (notChosenVidIndex == -1 && chosenVidIndex != -1){
      ranking.splice(chosenVidIndex,0,notChosen);
      notChosenVidIndex = ranking.length - 1; // set as back
    } 
    else if (chosenVidIndex == -1 && notChosenVidIndex == -1){
      ranking.splice(0,0,notChosen);
      ranking.splice(1,0,chosen);
    }
    ranking.forEach(v => console.log("ranking: "+String(v.id)));
    return ranking;
  });
  setStart(performance.now());
}, [current_video_pair]);


  // keyboard support: ArrowLeft picks left, ArrowRight picks right
  useEffect(() => {
    setTitleFloat(false);
    const handler = (e) => {
      if (ended || loading) return;
      if (e.key === "ArrowLeft") onChoose("left");
      if (e.key === "ArrowRight") onChoose("right");
    };
    window.addEventListener("keydown", handler);
    rankings.forEach((video, index) => {
      rankedVideos[video.id] = index;
      console.log("ended id: "+video+", index: "+index);
    });
      setTimeout(() => {
         setTitleFloat(true);
      }, 1000); // small delay ensures first render happens at opacity 0
    return () => window.removeEventListener("keydown", handler);
  }, [ended, loading, pair]);

function shuffleNoConsecutive(arr) { // important to ensure that the same behavior of swarm is not shown more than once, ChatGPT provided function
  if (arr.length <= 1) return arr.slice();

  // Copy array to avoid mutation
  let result = [];
  let temp = arr.slice();

  // Helper function to pick a random element not equal to prev
  function pickRandomExcluding(exclude) {
    const filtered = temp.filter(x => x !== exclude);
    if (filtered.length === 0) return null; // no option but to pick exclude
    const choice = filtered[Math.floor(Math.random() * filtered.length)];
    return choice;
  }

  // Start by picking any element randomly
  let prev = null;

  while (temp.length > 0) {
    let choice = pickRandomExcluding(prev);

    // If no other option, pick prev (will create consecutive duplicate)
    if (choice === null) {
      choice = prev;
    }

    // Remove the choice from temp (one occurrence)
    const index = temp.indexOf(choice);
    temp.splice(index, 1);

    result.push(choice);
    prev = choice;
  }

  return result;
}

  const restart = () => {
    console.log("in restart");
    loadVideos();
    const s = shuffleNoConsecutive(items);
    console.log("Number of items is "+String(items.length));
    console.log("Item first is "+s[0].url);
    setPool(s);
    if (s.length >= 2) {
      console.log("set pair to first two");
      setPair([s[0], s[1]]);
      setPool(prev => {
        // compute new pool from current state if needed
        return s.slice(2);
      });
    } else {
      console.log("just list is s");
      setPair(s);
      setPool([]);
    }
    setResults([]);
    setRankings([]);
    setBehavior(s[0].id.split("/")[2]);
    setEnded(false);
    setTitleFloat(false);
    console.log("setting float");
    setStart(performance.now());
  };

  useEffect(() => {
    setDisplay((n) => ( (n+1)%2 ));
  }, [numChanges]);

  function disp(time) {
    text += String(time) + ",";
  }
  //        <InstructionBoard msgs={start_messages} />

  if (startInstructions) {
    return (
      <div style={{ justifyContent: 'flex-start', alignItems: 'center', flexDirection: 'column', display: 'flex', width: '100%', minHeight: '100vh', overflowX: 'hidden', background: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), radial-gradient(circle at center, rgba(0,0,204,0.6) 50%, rgba(179,217,255, 0.6) 100%), url('swarm-background.jpg')`, transition: 'background-image 0.5s ease', backgroundSize: '100% 100%, 100% 100%, contain', backgroundPosition: 'center, center, center', backgroundRepeat: 'no-repeat, no-repeat, no-repeat', backgroundBlendMode: 'multiply',}}>
      <Box sx={{
         width: '100%',
         height: 'flex',
         display: 'flex',
         backgroundColor: "rgba(0,0,0,0.5)",
      }}>
         <Box 
            component="img"
            sx={{height:'50px',alignItems:'center',justifyContent:'center',display:'flex',}}
            src={`${process.env.PUBLIC_URL}/exalabs-logo.png`}
         />
         <Typography sx={{ margin: '10px', fontWeight: 'bold', color: '#FFF', borderLeft: '50px solid rgba(0,0,0,0)', }}> Exalabs UMass Lowell </Typography>
      </Box>
        <MainHeader fadeAnimation={titleFloat} />
        <Button sx= {{ gap: '150px', margin: '100px 0'}} variant="contained" onClick={() => {
           setStartInstructions(false);
           setInitSurvey(true);
           setTitleFloat(true);
        }}> <strong>Start</strong> </Button>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20 }}>Loading videos…</div>;
  if (ended) {
    rankedVideos = {};
    selectionTimes = {};
    notSelectionTimes = {};
    rankings.forEach((video, index) => {
      rankedVideos[video.id+'NAME:'+video.name] = index;
      console.log("id: "+video+", index: "+index);
    });
    times.forEach((time) => {
      chosenVids.forEach((chosenVid) => {
        selectionTimes[time] = chosenVid;
      });
    });
    times.forEach((time) => {
      notChosenVids.forEach((notChosenVid) => {
        notSelectionTimes[time] = notChosenVid;
      });
      console.log("time: ", time);
    });
    
    return (
      <>
      <div style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', display: 'flex', width: '100%', minHeight: '100vh', overflowX: 'hidden', background: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), radial-gradient(circle at center, rgba(0,0,204,0.6) 50%, rgba(179,217,255, 0.6) 100%), url('swarm-background.jpg')`, transition: 'background-image 0.5s ease', backgroundSize: '100% 100%, 100% 100%, contain', backgroundPosition: 'center, center, center', backgroundRepeat: 'no-repeat, no-repeat, no-repeat', backgroundBlendMode: 'multiply',}}>
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
            sx={{height:'50px',alignItems:'center',justifyContent:'center',display:'flex',}}
            src={`${process.env.PUBLIC_URL}/exalabs-logo.png`}
         />
         <Typography sx={{ margin: '10px', fontWeight: 'bold', color: '#FFF', borderLeft: '50px solid rgba(0,0,0,0)', }}> Exalabs UMass Lowell </Typography>
      </Box>
        <Box sx={{ justifyContent: 'center', alignItems: 'center', position: 'relative', opacity: titleFloat ? 1 : 0, transform: titleFloat ? "translateY(0)" : "translateY(-50px)", transition: "opacity 1s ease-out, transform 1s ease-out", }}>
           <Typography sx={{fontWeight: 'bold', fontSize: '50px', alignItems: 'center', justifyContent: 'center', display: 'flex', position: 'relative', margin: '50px', color: '#FFF',}}>Survey complete</Typography>
        </Box>
        <EmailBox xpos='0%' ypos='20%'/>
        <Button sx= {{ gap: '50px', margin: '50px 0', borderBottom: '100px', color: '#FFF', '&:hover': { backgroundColor: 'rgba(150, 220, 255, 0.9)' }, fontSize: '25px', }} onClick={restart}>Restart</Button>
       </div>
      </>
    );
  }

  if (!pair || pair.length < 2) {
    return (
      <div style={{ padding: 20 }}>
      <Box sx={{
         width: '100%',
         height: 'flex',
         display: 'flex',
         backgroundColor: "rgba(0,0,0,0.5)",
      }}>
         <Box 
            component="img"
            sx={{height:'50px',alignItems:'center',justifyContent:'center',display:'flex',}}
            src={`${process.env.PUBLIC_URL}/exalabs-logo.png`}
         />
         <Typography sx={{ margin: '10px', fontWeight: 'bold', color: '#FFF', borderLeft: '50px solid rgba(0,0,0,0)', }}> Exalabs UMass Lowell </Typography>
      </Box>
        <h2>Not enough videos to compare</h2>
        <Button sx= {{ gap: '150px', margin: '100px 0'}}  onClick={restart}>Reload</Button>
      </div>
    );
  }
  
  return (
    <div style={{ justifyContent: 'center', flexDirection: 'column', display: 'flex', width: '100%', flexDirection:'column', minHeight: '100vh', overflowX: 'hidden', background: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), radial-gradient(circle at center, rgba(0,0,204,0.6) 50%, rgba(179,217,255, 0.6) 100%), url('swarm-background.jpg')`, transition: 'background-image 0.5s ease', backgroundSize: '100% 100%, 100% 100%, contain', backgroundPosition: 'center, center, center', backgroundRepeat: 'no-repeat, no-repeat, no-repeat', backgroundBlendMode: 'multiply',}}>
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", alignItems: 'stretch', }}>
      <div>
      <Box sx={{
         width: '100%',
         height: 'flex',
         display: 'flex',
         backgroundColor: "rgba(0,0,0,0.5)",
      }}>
         <Box 
            component="img"
            sx={{height:'50px',alignItems:'center',justifyContent:'center',display:'flex',}}
            src={`${process.env.PUBLIC_URL}/exalabs-logo.png`}
         />
         <Typography sx={{ margin: '10px', fontWeight: 'bold', color: '#FFF', borderLeft: '50px solid rgba(0,0,0,0)', }}> Exalabs UMass Lowell </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, padding: '30px', color: '#FFF' }}>
        <span>Click the video you think is{' '}</span>&nbsp;
        <span><strong>more complex</strong></span>&nbsp;
        <span>.</span> 
      </Box>
      
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
        <VideoCard item={pair[0]} onChoose={() => onChoose("left")} position="left" fadeAnimation={visible} />
        <VideoCard item={pair[1]} onChoose={() => onChoose("right")} position="right" fadeAnimation={visible} />
      </div>

      <Box sx={{  justifyContent: 'center', display: 'flex', gap: '50px' }}>
         <Box sx={{ border: '5px solid #0080FF', fontSize: 30, borderRadius: '10px', padding: '30px', gap: '50px',  alignItems: 'center', justifyContent: 'center', display: 'inline-block', backgroundColor: 'rgba(179, 217, 255, 0.67)', }}>
         <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', }}><strong>{chosenVids.length} / {surveyVids.length - 1}</strong></div> 
         </Box>
      </Box>
      <div style={{ display: "flex", justifyContent: 'center', alignItems: 'stretch', padding: '15px', gap: '10px' }}>
        <Timerbox start={start} time_to_choose={choiceTime} />
      </div>
      </div>
      
    </div>
    </div>
  );
}

const count = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);
  return (
    String(minutes).padStart(2, "0") + ":" +
    String(seconds).padStart(2, "0") + ":" +
    String(milliseconds).padStart(3, "0")
  );
};

function Timerbox({ start, time_to_choose }) {
  const [timer, setTimer] = useState(0);  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(performance.now() - start);
    }, 16);
    return () => clearInterval(interval);
  }, [start]);
  return (
    <div style={{ width: '200px', height: '200px', borderRadius: '200px', backgroundColor: "#CCFFFF", justifyContent: 'center', alignItems: 'center', display: 'flex', }}>
      <div style={{ width: '180px', height: '180px', borderRadius: '180px', backgroundColor: "#4D4DFF", position: 'relative', justifyContent: 'center', alignItems: 'center', display: 'flex', }}>
        <div style={{ width: '170px', height: '170px', borderRadius: '170px', backgroundColor: "#CCFFFF", justifyContent: 'center', alignItems: 'center', display: 'flex', }}>
          <Typography sx={{ alignItems: 'center', fontWeight: 'bold', fontFamily: "'Orbitron', monospace", fontSize: '1.5rem', textShadow: `0 0 5px rgba(0,0,255,0.6), 0 0 10px rgba(0,0,255,0.4)`}}>{ count(timer, time_to_choose) }</Typography>
        </div>
      </div>
    </div>
  );
} 

function VideoCard({ item, onChoose, position = "left", fadeAnimation }) {
  if (!item) return null;
  console.log("In video card, "+fadeAnimation);
  console.log("URL: "+item.url);
  return (
    <Box
      onClick={onChoose}
      role="button"
      tabIndex={0}
      sx={{
        cursor: "pointer",
        width: "50%",
        border: "10px solid #ddd",
        borderRadius: 8,
        padding: 4,
        margin: '10px',
        boxSizing: "border-box",
        backgroundColor: 'rgba(179, 217, 255, 0.67)', 
        '&:hover': { boxShadow: '0px 0px 40px #54A6F0' },
        opacity: fadeAnimation ? 1 : 0, 
        transform: fadeAnimation ? "translateX(0)" : position === "left" ? "translateX(-30px)" : "translateX(30px)",
        transition: "opacity 1s ease-out, transform 1s ease-out",
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onChoose();
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#000', }}>{item.name || item.id}</div>
      <img
        src={`${encodeURI(item.url)}`}
        controls
        style={{ width: "100%", height: "320px", objectFit: "cover", borderRadius: 6, gap: '10px 10px', }}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "#000" }}></div>
    </Box>
  );
}

// -----Expandable videocard-------
interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme }) => ({
  marginLeft: 'auto',
  transition: 'transform 0.3s ease-in-out',
  variants: [
    {
      props: ({ expand }) => !expand,
      style: {
        transform: 'rotate(0deg)',
      },
    },
    {
      props: ({ expand }) => !!expand,
      style: {
        transform: 'rotate(180deg)',
      },
    },
  ],
}));


function RankCard({ item, index, position = "left" }) {
  const [expanded, setExpanded] = useState(false);
  const [url,name] = item.split("NAME:");
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  if (!item) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        cursor: "pointer",
        maxWidth: "900px",
        width: "100%",
        border: "1px solid #0055FF",
        borderLeft: "6px solid #0055FF", // ← accent bar
        borderRight: "6px solid #0055FF", // ← accent bar
        borderRadius: 8,
        padding: '8px',
        boxSizing: "border-box",
        backgroundColor: 'rgba(179, 217, 255, 0.67)',
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onExpand();
      }}
    >
    <Box>
    <Box sx={{ display: 'flex', alignItems: 'center',}}>
      <div style={{
          width: '200px',
          height: '100px',
          flexDirection: 'horizontal',
          backgroundColor: "#f0f4ff",
          display: 'flex',
          alignItems: "center",
          justifyContent: "center",
          padding: '6px 30px',
          fontSize: '20px',
          fontWeight: 700,
          color: "#3f51b5",
          borderRadius: '50px',
          borderLeft: "1px solid #ddd",
        }}> 
        {index}
      </div>
      <Box sx={{
      flex: 1,
      width: '500px',
      fontSize: '1.7rem',
      fontWeight: 600,
      textAlign: 'left',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      }}>
        {name}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems:'center',  }}>
    
        <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show parameters"
          title="Toggle Parameters"
          sx={{ ml: 1,}} // Add margin for spacing
        >
          <ExpandMoreIcon sx={{ flex: 1, width: 'flex' }} />
        </ExpandMore>
      </Box>
      </Box>

      <Collapse in={expanded} timeout={100} unmountOnExit>
      <Box sx={{ 
            pt: 1, 
            mt: 1, 
            pl: '115px', // Aligns description text with video name
            borderTop: '1px solid #eee', 
            width: 'flex', 
            backgroundColor: '#f9f9f9',
            borderRadius: '0 0 8px 8px',
            pr: 1, pb: 1 
        }}>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
          <strong style={{ color: '#007bff' }}><strong>URL:</strong><p>{url}</p></strong>
        </Typography>
      <img
        src={process.env.PUBLIC_URL+'/'+url}
        controls
        style={{ width: 'flex', height: "320px", borderRadius: 2 }}
      />
      </Box>
      </Collapse>
    </Box>


      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>{item.id}</div>
    </div>
  );
}


function startBoard({ children }) {
      <Box sx={{ 
            pt: 1, 
            mt: 1, 
            pl: '115px', // Aligns description text with video name
            borderTop: '1px solid #eee', 
            width: '100%', 
            backgroundColor: '#0044CC',
            borderRadius: '10%',
            pr: 1, pb: 1 
        }}>
         {children}
      </Box>
}
// startBoard <-- instructionCard <-- presurvey_messages
// instructionboard <-- instructionCard <-- presurvey_messages

const start_messages = [{ type: "instruction", textBefore: "Hello!\nWelcome to the swarm complexity ranking survey!\nClick ", bold: "Next Page", textAfter: " to start the survey."}];
const presurvey_messages = ["You will be presented with a series of videos that you will be asked to rank according to complexity.",
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

function InstructionBoard({ msgs }) {
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

function ChoiceCard({ chosen, notChosen, time }) {
   return (
    <Box>
    <Box sx={{
       display:'flex', 
       justifyContent:'center',
       alignItems: 'center',
    }}>
     <Box sx={{
        borderColor:'#006699',
        background:'rgba(179, 217, 255, 0.67)',
        border:'10px solid #006699',
        borderRadius: '5px',
        justifyContent:'center',
        alignItems: 'center',
        display:'flex',
        flexDirection: 'column',
     }}>
       <Typography sx={{
         fontFamily: `'Orbitron', 'Roboto Mono', 'JetBrains Mono', monospace`,
         fontWeight: 600,
         letterSpacing: '0.12em',
         textTransform: 'uppercase', 
         alignItems:'center',        
       }}>
        Chosen:
       </Typography>
       <Typography sx={{ padding:'15px', }}>
        {chosen}
       </Typography>
     </Box>
     <Box sx={{
        borderColor:'#006699',
        background:'rgba(179, 217, 255, 0.67)',
        border:'10px solid #006699',
        borderRadius: '5px',
        justifyContent:'center',
        alignItems: 'center',
        display:'flex',
        flexDirection: 'column',
     }}>
       <Typography sx={{
         fontFamily: `'Orbitron', 'Roboto Mono', 'JetBrains Mono', monospace`,
         fontWeight: 600,
         borderRadius: '5px',
         letterSpacing: '0.12em',
         textTransform: 'uppercase',  
         alignItems:'center',               
       }}>
        Not chosen:
       </Typography>
       <Typography sx={{ padding:'15px', borderRadius: '5px',}}>
        {notChosen}
       </Typography>
     </Box>
    </Box>
     <Box sx={{
        borderColor:'#006699',
        background:'rgba(179, 217, 255, 0.67)',
        borderRadius: '5px',
        border:'5px solid #006699',
	gap:'10px',
        justifyContent:'center',
        alignItems: 'center',
        display:'flex',
        flexDirection:'row',
     }}>
       <Typography sx={{ padding:'15px 0px', borderRadius: '5px', }}>
        Time to choose:
       {time} seconds
       </Typography>
     </Box>
    </Box>
   );
}


function HelpBox({ headline, msg, xpos, ypos }) {
   return (
      <Box sx={{      
          position: 'absolute',
          justifyContent: 'center',
          top: ypos,
          left: xpos,
          transform: 'translate(-${xpos}, -${ypos})', 
          height: 'flex',
          padding: '20px 20px',
          zIndex: 1300,
          backgroundColor: '#99CCFF',
          border: '10px solid #001580',
          borderRadius: '5px',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',  
      }}>
         <h2><strong>{headline}</strong></h2>
         <p><Typography sx={{ fontSize: '20px' }}>{msg}</Typography></p>
      </Box>
   );
}


const parseParams = (filename) => {
    const params = [];
    const part_to_parse = filename.split("/").pop() || filename;  // get last part of filename
    const is_gif = filename.includes(".gif"); // is file .gif?
    let param_names = part_to_parse.split(".gif");
    param_names = param_names[0].split("_"); // get params and values
    const date = param_names[0];
    const param_parts = is_gif ? param_names.slice(1) : param_names; // split by parameters if the file is a gif
    param_parts.forEach((part) => {
        const [paramtype, paramval] = part.split("="); // split by type of parameter (ex. vision) and value
        if (paramtype && paramval) {
            params.push(paramtype + ":" + parseFloat(paramval)); // if there is a parameter type and value, then pair them
        }
    });
    console.log("in function: "+params);
    return [date, params];
}

const getFile = () => {
    // 1. Define CSV headers

    let date = new Date();
    let formattedDate = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}-${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}`;
    console.log(formattedDate);

    // 2. Map items to CSV rows
    const csvRows = Object.entries(rankedVideos).map((rankedVid, index) => {
      // Parse parameters again to include their values in the CSV
      console.log("ranked: "+rankedVid);
      let rankedVidParts = rankedVid[0].split("NAME:");

      const [url, name] = rankedVidParts;
      console.log("url: "+url);
      console.log("name: "+name);
      console.log("index: "+index);

      let [date, params] = parseParams(url);
      console.log("params: "+params);

      //const paramValues = Object.entries(params).map(p => params[p] !== undefined ? params[p] : 'N/A');
      let paramValues = [];
      params.forEach(p => { 
          console.log("param: "+p);
          paramValues.push(p.split(":")[1]);
      });
      return [
        index+1, // Current Rank
        name, 
        ...paramValues
      ].join(',');

    });
    const headers = [
      "Rank", 
      "Name", 
      "vision",
      "min separation",
      "max alignment turn",
      "max coherence turn",
      "max separation turn",
      "population"
    ];
    console.log("csvrows: "+csvRows);
    const content = [
      headers.join(','),
      ...csvRows
    ];  //.join('\n');

    const choices = Object.entries(selectionTimes).map((selectionTime, index) => {
      // Parse parameters again to include their values in the CSV
      console.log("selectionTime: "+selectionTime);
      let [time, name] = selectionTime;

      console.log("name: "+name);
      console.log("time: "+time);
      console.log("index: "+index);

      let [date, params] = parseParams(name);

      let paramValues = [];
      params.forEach(p => { 
          console.log("param: "+p);
          paramValues.push(p.split(":")[1]);
      });
      console.log([
        time, // Current time
        name, 
        notSelectionTimes[time],
      ]);
      return [
        time, // Current time
        name, 
        notSelectionTimes[time],
      ].join(',');
      
    });
    const new_headers = [
      "Time", 
      "Chosen", 
      "Not chosen"
    ];
    console.log("choices: "+choices);


    const new_content = [
      'Ranked videos',
      ...content,
      '',
      '',
      'Choice selections',
      new_headers.join(','),
      ...choices

    ].join('\n');
    let resultsContent = new_content;
    let resultsFile = 'video_complexity_order-'+formattedDate+'.csv';
    return [resultsFile, resultsContent];
} 

const downloadOrderAsCSV = () => {
    let [resultsFile, resultsContent] = getFile();
    // 3. Create a Blob and download link
    const blob = new Blob([resultsContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 4. Trigger download
    const link = document.createElement('a');
    link.href = url;
   
    // get date
    link.setAttribute('download', resultsFile);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
};


function EmailBox({ xpos, ypos}) {

      // Download CSV results
    return (
      <Box sx={{ 
         position: 'relative',
         display: 'inline-block', 
         flexDirection: 'column',
         top: '20%',
         left: '0%',
      }}>
        <Button sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            margin: '15px',
            //border: '5px solid #0000E6',
            borderRadius: '5px',
            backgroundColor: 'rgba(149, 128, 255, 0.5)', 
            padding: '20px',
            color: '#0022CC',
            '&:hover': {
                backgroundColor: 'rgba(246, 250, 255, 0.9)',
                color: '#4DA6FF', 
            },
        }} onClick={ () => downloadOrderAsCSV() }>
            <Typography sx={{ fontWeight: 'bold', fontSize: '30px', transition: 'color 0.2s ease', }} color="inherit">Download CSV Results</Typography>
        </Button>
        <Button sx={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            margin: '5px',
            //border: '5px solid #8095FF',
            borderRadius: '5px',
            backgroundColor: 'rgba(128, 207, 255, 0.5)', 
            padding: '20px', 
            color: '#0022CC',
            '&:hover': {
                backgroundColor: 'rgba(246, 250, 255, 0.9)',
                color: '#4DA6FF',
            },
        }} onClick={ () => renderEmail() }>
            <Typography sx={{ fontWeight: 'bold', fontSize: '30px', transition: 'color 0.2s ease',}} color="inherit">Email results</Typography>
        </Button>
      </Box>
    );
}


const sendEmail = () => {  
    let [resultsFile, resultsContent] = getFile();
    console.log(resultsContent);
    resultsContent = resultsContent.replace(/,/g, '\t|');
const attachments = [
  {
    name: resultsFile,               // filename
    data: resultsContent,                   // base64 string (no prefix)
    type: 'text/csv'                   // MIME type
  }
];
console.log("Sending "+resultsFile);
//const handleEmail = (e) => {
//e.preventDefault();
emailjs.send('service_oua0645', 'template_0sn1aba', {
  name: 'Sriram',
  email: 'sriramk1000@gmail.com',
  message: 'Please find attached CSV results:\n'+resultsContent,
  //content: resultsContent
}, '79TzH81kp9RcNqdrX')
.then(response => {
  console.log('Email sent successfully!', response.status, response.text);
})
.catch(err => {
  console.error('Failed to send email.', err);
});
//}
};

function renderEmail() {
  let [resultsFile, resultsContent] = getFile();
  const file = new File([resultsContent], resultsFile, { type: "text/csv" });
  const formData = new FormData();
  formData.append("file", file);
  console.log("Sending ", file);
  fetch("https://swarm-backend-ga0y.onrender.com/send-email", {
    method: "POST",
    body: formData
  })
    .then((res) => res.text())
    .then((text) => {
      console.log(text); // "Email sent!"
      alert(text);
    })
    .catch((err) => {
      console.error(err);
      alert("Error sending email"+err);
    });

}


function MainHeader({ fadeAnimation }) {
  return (
    <Box sx={{    
      width: 'flex',
      height: '80%', 
      textAlign: 'center', 
      justifyContent: 'center',
      fontSize: '100px',
      fontColor: '#FFF',
      padding: '100px',
      opacity: fadeAnimation ? 1 : 0, 
      transform: fadeAnimation ? "translateY(0)" : "translateY(-50px)",
      transition: "opacity 1s ease-out, transform 1s ease-out",
    }}>
      <Typography sx={{fontWeight: 'bold', fontSize: '70px', alignItems: 'center', justifyContent: 'center', display: 'flex', position: 'relative', padding: '20px', color: '#FFF', }}>
        Welcome to the swarm complexity ranking survey!
      </Typography>
    </Box>
  );
}

/* Double arrow for complexity */
function DoubleArrow({ xpos, ypos }) {
  console.log("ranked videos length: "+Object.keys(rankedVideos).length*100);
  return (
  <Box sx={{top: ypos,
          left: xpos,
          transform: 'translate(-${xpos}, -${ypos})', position: 'absolute', }}>
  <Box sx={{
     width: 0,
     height: 0,
     borderLeft: '40px solid transparent',
     borderRight: '40px solid transparent',
     borderBottom: '80px solid #FF1919',
  }}/>

  <Box sx={{ display: 'flex', flexDirection: 'column', }}>
  <Box sx={{
     display: 'inline-block',
     flexDirection: 'column',
     top: `calc(${ypos} + ${Object.keys(rankedVideos).length/2} - 0%)`,
     transform: 'translateY(-10%)',
     left: `calc(${xpos} + 70%)`,
     position: 'absolute',
     background: '#4D6AFF',
     border: '5px solid #003399',
     borderRadius: '8px',
     textColor: '#FFF',
     padding: '5px',
     fontSize: '25px',
  }}>
  <Typography sx={{fontWeight: 'bold', fontSize: '25px', alignItems: 'center', justifyContent: 'center', display: 'flex', position: 'relative', margin: '20px', fontFamily: "'Orbitron', monospace", }}>
     Most complex
  </Typography>
  </Box>
  <Box sx={{
     transform: 'translateX(45%) translateY(20%)',
     width: 0,
     height: 0,
     marginLeft: `calc(${xpos} + 230%)`,
     borderBottom: '40px solid transparent',
     borderTop: '40px solid transparent',
     borderLeft: '80px solid #000',
     position: 'absolute'
  }}/>
  </Box>

  <Box sx={{
     width: 80,
     height: Object.keys(rankedVideos).length * 150,
     background: 'linear-gradient(rgba(255,25,25), rgba(0,0,0))',
  }}/>



  <Box sx={{ display: 'flex', flexDirection: 'column', }}>
  <Box sx={{
     display: 'inline-block',
     flexDirection: 'column',
     top: `calc(${ypos} - ${Object.keys(rankedVideos).length/2} + 10%)`,
     transform: 'translateY(-110%)',
     left: `calc(${xpos} + 70%)`,
     position: 'absolute',
     background: '#4D6AFF',
     border: '5px solid #003399',
     borderRadius: '8px',
     textColor: '#FFF',
     padding: '5px',
  }}>
  <Typography sx={{fontWeight: 'bold', fontSize: '25px', alignItems: 'center', justifyContent: 'center', display: 'flex', position: 'relative', margin: '20px', fontFamily: "'Orbitron', monospace", }}>
     Least complex
  </Typography>
  </Box>
  <Box sx={{
     transform: 'translateX(40%) translateY(-135%)',
     width: 0,
     height: 0,
     marginLeft: `calc(${xpos} + 230%)`,
     borderBottom: '40px solid transparent',
     borderTop: '40px solid transparent',
     borderLeft: '80px solid #000',
     position: 'absolute'
  }}/>
  </Box>

  <Box sx={{
     width: 0,
     height: 0,
     borderLeft: '40px solid transparent',
     borderRight: '40px solid transparent',
     borderTop: '80px solid #000',
  }}/>

  </Box>
  );
};