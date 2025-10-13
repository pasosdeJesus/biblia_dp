for i in lucas hechos mateo juan marcos romanos corintios1 corintios2 efesios galatas hebreos timoteo1 filipenses colosenses ; do 
  echo $i;
  split -p "<sc" ../$i.gbfxml $i-
  for j in $i*; do
    
    n=`echo $j | sed -e "s/-aa/-00.xml/g" |\
      sed -e "s/-ab/-01.xml/g" |\
      sed -e "s/-ac/-02.xml/g" |\
      sed -e "s/-ad/-03.xml/g" |\
      sed -e "s/-ae/-04.xml/g" |\
      sed -e "s/-af/-05.xml/g" |\
      sed -e "s/-ag/-06.xml/g" |\
      sed -e "s/-ah/-07.xml/g" |\
      sed -e "s/-ai/-08.xml/g" |\
      sed -e "s/-aj/-09.xml/g" |\
      sed -e "s/-ak/-10.xml/g" |\
      sed -e "s/-al/-11.xml/g" |\
      sed -e "s/-am/-12.xml/g" |\
      sed -e "s/-an/-13.xml/g" |\
      sed -e "s/-ao/-14.xml/g" |\
      sed -e "s/-ap/-15.xml/g" |\
      sed -e "s/-aq/-16.xml/g" |\
      sed -e "s/-ar/-17.xml/g" |\
      sed -e "s/-as/-18.xml/g" |\
      sed -e "s/-at/-19.xml/g" |\
      sed -e "s/-au/-20.xml/g" |\
      sed -e "s/-av/-21.xml/g" |\
      sed -e "s/-aw/-22.xml/g" |\
      sed -e "s/-ax/-23.xml/g" |\
      sed -e "s/-ay/-24.xml/g" |\
      sed -e "s/-az/-25.xml/g" |\
      sed -e "s/-ba/-26.xml/g" |\
      sed -e "s/-bb/-27.xml/g" |\
      sed -e "s/-bc/-28.xml/g"
    `
    echo "$j -> $n"
    mv $j $n
  done; 
  read

done
