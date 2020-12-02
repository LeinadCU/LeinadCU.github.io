<?php
  $myFile = "../js/learnX.json";
  $fh = fopen($myFile, 'w') or die("Error");
  $stringData = $_POST["data"];
  fwrite($fh, $stringData);
  fclose($fh);
  echo "Saved!";
?>
