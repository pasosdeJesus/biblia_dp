for i in lucas hechos mateo juan marcos romanos corintios1 corintios2 efesios galatas hebreos timoteo1 filipenses colosenses tesalonicenses1 tesalonicenses2 timoteo2 tito filemon; do 
  echo $i;
  split -p "<sc" ../../$i.gbfxml $i-
  for j in $i*; do
    
    n=`echo $j | sed -e "s/-aa/-00.gbf.xml/g" |\
      sed -e "s/-ab/-01.gbf.xml/g" |\
      sed -e "s/-ac/-02.gbf.xml/g" |\
      sed -e "s/-ad/-03.gbf.xml/g" |\
      sed -e "s/-ae/-04.gbf.xml/g" |\
      sed -e "s/-af/-05.gbf.xml/g" |\
      sed -e "s/-ag/-06.gbf.xml/g" |\
      sed -e "s/-ah/-07.gbf.xml/g" |\
      sed -e "s/-ai/-08.gbf.xml/g" |\
      sed -e "s/-aj/-09.gbf.xml/g" |\
      sed -e "s/-ak/-10.gbf.xml/g" |\
      sed -e "s/-al/-11.gbf.xml/g" |\
      sed -e "s/-am/-12.gbf.xml/g" |\
      sed -e "s/-an/-13.gbf.xml/g" |\
      sed -e "s/-ao/-14.gbf.xml/g" |\
      sed -e "s/-ap/-15.gbf.xml/g" |\
      sed -e "s/-aq/-16.gbf.xml/g" |\
      sed -e "s/-ar/-17.gbf.xml/g" |\
      sed -e "s/-as/-18.gbf.xml/g" |\
      sed -e "s/-at/-19.gbf.xml/g" |\
      sed -e "s/-au/-20.gbf.xml/g" |\
      sed -e "s/-av/-21.gbf.xml/g" |\
      sed -e "s/-aw/-22.gbf.xml/g" |\
      sed -e "s/-ax/-23.gbf.xml/g" |\
      sed -e "s/-ay/-24.gbf.xml/g" |\
      sed -e "s/-az/-25.gbf.xml/g" |\
      sed -e "s/-ba/-26.gbf.xml/g" |\
      sed -e "s/-bb/-27.gbf.xml/g" |\
      sed -e "s/-bc/-28.gbf.xml/g"
    `
    echo "$j -> $n"
    mv $j $n
  done; 

done
