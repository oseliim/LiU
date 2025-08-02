nome=`who | grep aluno | cut -d" " -f1`
numero=`echo $nome | cut -d" " -f2 | cut -d"o" -f2`
#echo $numero
umount /home/aluno$numero
mount /dev/sda2 /home
chown -R aluno$numero /home/aluno$numero
chgrp -R aluno$numero /home/aluno$numero
