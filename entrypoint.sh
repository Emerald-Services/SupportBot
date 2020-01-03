 cd /home/container

if [ "${GIT_CLONE}" == "true" ] || [ "${GIT_CLONE}" == "1" ]; then
	if [ "$(ls -A /home/container)" ]; then
		echo "Pulling Updates"
		git pull 
	else 
		echo -e "/home/container is empty.\nCloning files into the directory."
		git clone https://github.com/1tzemerald/SupportBot.git
	fi
fi

sed -i '/s/BOT_TOKEN_HERE/${BOT_TOKEN}/g' settings.json
MODIFIED_STARTUP=`eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')`
${MODIFIED_STARTUP}
