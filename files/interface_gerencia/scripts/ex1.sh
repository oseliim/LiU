while read ip
do
	ip1=10.100.74.$ip
	echo $ip1
	echo $1 > /dev/tcp/$ip1/3535
	sleep 2
done < $2


