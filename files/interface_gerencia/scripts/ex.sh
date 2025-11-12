ip=1
while [ $ip -le 240 ]
do
	ip1=10.100.74.$ip
	saida=`echo d > /dev/tcp/$ip1/3535`
	s=`echo $saida | wc -c`
	if [ $s -eq 0 ];
	then
		echo Maquinas $ip1 desligada
	fi
	ip=`echo $ip+1|bc`
done

