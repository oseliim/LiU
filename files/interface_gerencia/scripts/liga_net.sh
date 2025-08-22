GATEWAY=$(ip route | grep '^default' | awk '{print $3}')

while read ip
do
	echo $ip
	echo "route add default gw $GATEWAY" > /dev/tcp/$ip/3535
#	sleep 30
done < $1
