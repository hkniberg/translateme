#!/usr/bin/env bash
rm -rf ../output/translateme.tar.gz
meteor build ../output --architecture os.linux.x86_64
cd ../output
mv translateme.tar.gz translateme.tar.gz
echo "in nodechef, type deploy -i translateme"
nodechef