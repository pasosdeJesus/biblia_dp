
/[0-9]*:[0-9]*/ {
  # print "*OJO : FNR=" FNR
  if (ultpos ~ /^[0-9]*$/) {
    lin="";
    for (i=1; i<=ultpos; i++) {
      if (ver[i]=="") {
    	print $0 > "/dev/stderr";
        print FILENAME ":" FNR ":XFalta el " i "-esimo en " nant > "/dev/stderr";
        error=1;
      }
      else {
        lin=lin i"-"ver[i] " ";
      }
    }
    if (lin != "") {
      print nant " " lin;
    }
    ultpos = -1;
    delete ver;
    nant = $0;
  }
}

/[0-9]*,.*/ {
  # print "*OJO , FNR=" FNR
  split($0, e, /,/);
  if (ver[e[1]] != "") {
    print FILENAME ":" FNR ": Repetido el " e[1] "-esimo en " nant > "/dev/stderr";
    error=1;
  }
  ver[e[1]] = e[2];
  if (e[1] > ultpos || (ultpos ~ /^[0-9]*p$/)) {
    ultpos = e[1];
  }
}

BEGIN {
  ultpos = -1;
  error = 0;
  # ver serán versículos
}

END {
  lin = "";
  print "ultpos=" ultpos > "/dev/stderr";
  if (ultpos !~ /^[0-9]*:[0-9]*$/) {
    print "posición no entera: '" ultpos "'"> "/dev/stderr";
    error = 1;
  } else if (ultpos <= 0) {
    print "ultpos negativo" > "/dev/stderr";
    error=1;
  } else {
    for (i = 1; i <= ultpos; i++) {
      if (ver[i] == "") {
        print FILENAME ":" FNR ":Falta el " i "-esimo en " nant > "/dev/stderr";
        error=1;
      }
      else {
        lin=lin i "-" ver[i] " ";
      }
    }
    if (lin != "") {
      print nant " " lin;
    }
    ultpos=-1;
    delete ver;
  }

  exit error;
}
