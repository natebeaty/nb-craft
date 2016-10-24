from fabric.api import *
import os
from dotenv import Dotenv
dotenv = Dotenv(os.path.join(os.path.dirname(__file__), ".env")) # Of course, replace by your correct path
os.environ.update(dotenv)

env.hosts = ['natebeaty.com']
env.user = 'natebeaty'

env.path = '/Users/natebeaty/Sites/nb_craft'
env.remotepath = '/home/natebeaty/webapps/nb_craft'
env.s3_bucket = 'media.natebeaty.com'
env.git_branch = 'master'
env.warn_only = True

def production():
	env.user = 'natebeaty'
	env.hosts = ['natebeaty.com']
	env.remotepath = '/home/natebeaty/webapps/nb_craft'
	# s3sync()

def assets():
	local('gulp --production')

def deploy():
	update()
	# clear_cache()

def update():
	with cd(env.remotepath):
		run('git pull origin %s' % env.git_branch)

def clear_cache():
	with cd(env.remotepath):
		run('rm -rf cache/data/*')

def s3sync():
	# gzipped assets
	for dir in ['/dist/gz/']:
		env.dir = dir
		local('s3cmd -P --add-header=Content-encoding:gzip --guess-mime-type --add-header=Cache-Control:max-age=3153600 --rexclude-from=%(path)s/s3exclude sync %(path)s%(dir)s s3://%(s3_bucket)s%(dir)s' % env)

	#non gzipped
	for dir in ['/dist/css/','/dist/js/','/img/','/js/','/css/']:
		env.dir = dir
		local('s3cmd -P --guess-mime-type --add-header=Cache-Control:max-age=3153600 --delete-removed --rexclude-from=%(path)s/s3exclude sync %(path)s%(dir)s s3://%(s3_bucket)s%(dir)s' % env)


def pushdb():
	local("mysqldump -u "+os.environ.get('DB_USER')+" -p'"+os.environ.get('DB_PASS') +
		"' "+os.environ.get('DB_NAME')+" | gzip -9 > ~/temp_db.sql.gz")
	# secure copy to local environment
	local("scp ~/temp_db.sql.gz "+env.user+"@"+env.hosts[0]+":")
	# copy remote backups to local database
	run("zcat ~/temp_db.sql.gz | mysql --user='"+os.environ.get('REMOTE_DB_USER') +
		"' --password='"+os.environ.get('REMOTE_DB_PASS') +
		"' --database "+os.environ.get('REMOTE_DB_NAME'))
	# cleanup files from local & remote environments
	run("rm ~/temp_db.sql.gz")
	local("rm ~/temp_db.sql.gz")
