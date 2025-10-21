for i in lucas hechos mateo juan marcos romanos corintios1 corintios2 efesios galatas hebreos timoteo1 filipenses colosenses ; do 
  echo $i;
  split -p "<sc" ../$i.gbfxml $i-
  for j in $i*; do
    
    n=`echo $j | sed -e "s/-aa/-00.gbfxml/g" |\
      sed -e "s/-ab/-01.gbfxml/g" |\
      sed -e "s/-ac/-02.gbfxml/g" |\
      sed -e "s/-ad/-03.gbfxml/g" |\
      sed -e "s/-ae/-04.gbfxml/g" |\
      sed -e "s/-af/-05.gbfxml/g" |\
      sed -e "s/-ag/-06.gbfxml/g" |\
      sed -e "s/-ah/-07.gbfxml/g" |\
      sed -e "s/-ai/-08.gbfxml/g" |\
      sed -e "s/-aj/-09.gbfxml/g" |\
      sed -e "s/-ak/-10.gbfxml/g" |\
      sed -e "s/-al/-11.gbfxml/g" |\
      sed -e "s/-am/-12.gbfxml/g" |\
      sed -e "s/-an/-13.gbfxml/g" |\
      sed -e "s/-ao/-14.gbfxml/g" |\
      sed -e "s/-ap/-15.gbfxml/g" |\
      sed -e "s/-aq/-16.gbfxml/g" |\
      sed -e "s/-ar/-17.gbfxml/g" |\
      sed -e "s/-as/-18.gbfxml/g" |\
      sed -e "s/-at/-19.gbfxml/g" |\
      sed -e "s/-au/-20.gbfxml/g" |\
      sed -e "s/-av/-21.gbfxml/g" |\
      sed -e "s/-aw/-22.gbfxml/g" |\
      sed -e "s/-ax/-23.gbfxml/g" |\
      sed -e "s/-ay/-24.gbfxml/g" |\
      sed -e "s/-az/-25.gbfxml/g" |\
      sed -e "s/-ba/-26.gbfxml/g" |\
      sed -e "s/-bb/-27.gbfxml/g" |\
      sed -e "s/-bc/-28.gbfxml/g"
    `
    echo "$j -> $n"
    mv $j $n
  done; 

done
