#!/bin/sh

l="$1"

if (test ! -f "../$l.usfm") then {
  echo "Falta base de archivo por renombrar como primer parametro e.g 41_Mark"
  exit 1;
} fi;

echo $l;
split -p "^.c " ../$l.usfm $l-
for j in $l*; do
  n=`echo $j | sed -e "s/-aa/-00.usfm/g" |\
    sed -e "s/-ab/-01.usfm/g" |\
    sed -e "s/-ac/-02.usfm/g" |\
    sed -e "s/-ad/-03.usfm/g" |\
    sed -e "s/-ae/-04.usfm/g" |\
    sed -e "s/-af/-05.usfm/g" |\
    sed -e "s/-ag/-06.usfm/g" |\
    sed -e "s/-ah/-07.usfm/g" |\
    sed -e "s/-ai/-08.usfm/g" |\
    sed -e "s/-aj/-09.usfm/g" |\
    sed -e "s/-ak/-10.usfm/g" |\
    sed -e "s/-al/-11.usfm/g" |\
    sed -e "s/-am/-12.usfm/g" |\
    sed -e "s/-an/-13.usfm/g" |\
    sed -e "s/-ao/-14.usfm/g" |\
    sed -e "s/-ap/-15.usfm/g" |\
    sed -e "s/-aq/-16.usfm/g" |\
    sed -e "s/-ar/-17.usfm/g" |\
    sed -e "s/-as/-18.usfm/g" |\
    sed -e "s/-at/-19.usfm/g" |\
    sed -e "s/-au/-20.usfm/g" |\
    sed -e "s/-av/-21.usfm/g" |\
    sed -e "s/-aw/-22.usfm/g" |\
    sed -e "s/-ax/-23.usfm/g" |\
    sed -e "s/-ay/-24.usfm/g" |\
    sed -e "s/-az/-25.usfm/g" |\
    sed -e "s/-ba/-26.usfm/g" |\
    sed -e "s/-bb/-27.usfm/g" |\
    sed -e "s/-bc/-28.usfm/g"
  `
  echo "$j -> $n"
  mv $j $n
done; 
