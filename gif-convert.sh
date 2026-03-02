#!/bin/bash
maindir="swarm-videos/"
files=("${maindir}"*)
for ((i=0; i<${#files[@]}; i++)); do
  if [[ -d "${files[i]}" ]]; then
     echo "directory ${files[i]}"
     vids=("${files[i]}/"*)
     for ((j=0; j<${#vids[@]}; j++)); do
         echo "vid ${vids[j]}"
         ffmpeg -i "${vids[j]}" "${vids[j]/.mp4/.gif}"
     done
  fi
done

