#!/bin/bash
viddir="swarm-videos/"
vids=("${viddir}"*)
json_str="["
json_str+=$'\n'
count=0

vidnum=$(find "${viddir}" -type f | wc -l)
echo "video number $vidnum"

for ((i=0; i<${#vids[@]}; i++)); do
   file_ext="${vids[i]}"

   if [ "${file_ext: -4}" == ".gif" ]; then
       echo "$file_ext"
       json_str+="{\"name\":\"VID${count}\","
       json_str+=$'\n'
       json_str+=" \"id\":\"/${vids[i]}\"}"
       if (( count < vidnum )); then
           json_str+=","
           json_str+=$'\n'
       fi
       count=$((count+1))
   elif [[ -d "${file_ext}" ]]; then
       vidlist=("${file_ext}/"*)
       for ((j=0; j<${#vidlist[@]}; j++)); do
           if [ "${vidlist[j]: -4}" == ".gif" ]; then

           count=$((count+1))
           echo $count
           json_str+="{\"name\":\"VID${count}\","
           json_str+=$'\n'
           json_str+=" \"id\":\"/${vidlist[j]}\"}"
           if (( count < vidnum )); then
               json_str+=","
               json_str+=$'\n'
           fi
           fi
       done
   fi
done
json_str+="]"
echo "${json_str}"
touch "video_paths.json"
echo $'\n'"${json_str}" > "video_paths.json"
   