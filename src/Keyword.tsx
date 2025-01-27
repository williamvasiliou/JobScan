import { newTitle, nonEmpty } from './Content'

import { fetchCreate, fetchUpdate, fetchDelete } from './Prisma'

export const byLabel = (previous, next) => previous.label > next.label

export const unique = (keywords) => {
	const items = []

	if (keywords.length > 0) {
		let previous = keywords[0]
		items.push(previous)

		for (let i = 1; i < keywords.length; ++i) {
			const keyword = keywords[i]

			if (keyword !== previous) {
				items.push(keyword)
			}

			previous = keyword
		}
	}

	return items
}

export const newKeywords = (keywords) => unique(keywords.trim().replaceAll('\n', ' ').split(',').map(newTitle).filter(nonEmpty).sort())

export const fix = (keyword) => keyword.replaceAll(' ', '[ ]+')

export const regex = (keyword) => `\\b(?i:${fix(keyword)})\\b`

export const newRegex = (keywords) => RegExp(keywords.map(regex).join('|'))

export const colorsFromPrisma = (colors, { id, color }) => ({
	...colors,
	[id]: color,
})

export const keywordsFromPrisma = ({ keyword }) => keyword

export const fromPrisma = (colors) => ({ id, label, colorId, keywords }) => {
	const highlightKeywordsList = keywords.map(keywordsFromPrisma).map(keywordsFromPrisma)
	const highlightKeywords = highlightKeywordsList.join(', ')

	const highlightColor = colors[colorId]

	return {
		id: id,
		colorId: colorId,
		isEditing: false,
		isColoring: false,
		isUpdatingColor: false,
		color: highlightColor,
		newColor: highlightColor,
		label: label,
		newLabel: label,
		keywords: highlightKeywords,
		newKeywords: highlightKeywords,
		regex: newRegex(highlightKeywordsList),
	}
}

const create = ([ label, keywords ]) => {
	const highlightLabel = label.label
	const highlightKeywordsList = keywords.map(keywordsFromPrisma)
	const highlightKeywords = highlightKeywordsList.join(', ')

	const color = label.color.color

	return {
		id: label.id,
		colorId: label.colorId,
		isEditing: false,
		isColoring: false,
		isUpdatingColor: false,
		color: color,
		newColor: color,
		label: highlightLabel,
		newLabel: highlightLabel,
		keywords: highlightKeywords,
		newKeywords: highlightKeywords,
		regex: newRegex(highlightKeywordsList),
	}
}

export const style = (colors) => (
	Object.entries(colors).map(([ colorId, color ]) => (
`.highlighted.color-${colorId} {
	color: #${color};
}

.color-edit.color-${colorId} {
	background-color: #${color};
}`
	)).join('\n')
)

export const addColor = (colorId, color, colors, setColors) => {
	if (!colors[colorId]) {
		setColors({
			...colors,
			[colorId]: color,
		})
	}
}

export const addKeyword = async (label, keywords, color, colors, setColors, highlights, setHighlights) => {
	const highlight = await fetchCreate('/highlights', {
		label: label,
		keywords: keywords,
		color: color,
	})

	if (highlight) {
		const newHighlight = create(highlight)

		addColor(newHighlight.colorId, newHighlight.color, colors, setColors)

		setHighlights([
			...highlights,
			newHighlight,
		].sort(byLabel))

		return true
	}

	return false
}

export const saveKeyword = async (highlight, updateHighlights) => {
	const { id, newLabel } = highlight

	const newHighlight = await fetchUpdate(`/highlights/${id}`, {
		label: newLabel,
		keywords: highlight.newKeywords,
	})

	if (newHighlight) {
		const [ label, keywords ] = newHighlight

		const highlightKeywordsList = keywords.map(keywordsFromPrisma)
		const highlightKeywords = highlightKeywordsList.join(', ')

		updateHighlights(highlight, () => ({
			...highlight,
			isEditing: false,
			label: label.label,
			newLabel: label.label,
			keywords: highlightKeywords,
			newKeywords: highlightKeywords,
			regex: newRegex(highlightKeywordsList),
		}))

		return true
	}

	return false
}

export const saveColor = async (highlight, updateColor, colors, setColors, updateHighlights) => {
	const { id, colorId, isUpdatingColor, color, newColor } = highlight

	const newHighlight = await fetchUpdate(`/highlights/${id}/colors/${colorId}`, {
		isUpdatingColor: isUpdatingColor,
		color: newColor,
	})

	if (newHighlight) {
		const highlightColorId = newHighlight.id
		const highlightColor = newHighlight.color

		if (isUpdatingColor) {
			updateColor(id, colorId, color, highlightColor)
		} else {
			addColor(highlightColorId, highlightColor, colors, setColors)

			updateHighlights(highlight, () => ({
				...highlight,
				colorId: highlightColorId,
				isColoring: false,
				isUpadingColor: false,
				color: highlightColor,
				newColor: highlightColor,
			}))
		}

		return true
	}

	return false
}

export const deleteKeyword = async (highlights, id, setHighlights) => {
	const highlight = await fetchDelete(`/highlights/${id}`)

	if (highlight) {
		setHighlights(highlights.filter((highlight) => highlight.id !== id))

		return true
	}

	return false
}

export const cancelEdit = (highlight) => ({
	...highlight,
	isEditing: false,
	newLabel: highlight.label,
	newKeywords: highlight.keywords,
})

export const cancelColor = (colors) => (highlight) => ({
	...highlight,
	isColoring: false,
	isUpdatingColor: false,
	newColor: colors[highlight.colorId],
})

export const highlights = () => [
	create('3GPP','3gpp'),
	create('5G','5g,5g lte'),
	create('AI','ai,artificial intelligence'),
	create('AKS','aks,azure kubernetes,azurekubernetes'),
	create('API','api,apis,application programming interface,application programming interfaces'),
	create('AUTOSAR','auto sar,auto-sar,autosar'),
	create('AWS','aws'),
	create('AWS CDK','aws cdk,aws-cdk,awscdk'),
	create('AWS CodePipeline','aws codepipeline,aws-codepipeline,code pipeline,code-pipeline,codepipeline'),
	create('Abacus','abacus'),
	create('Adobe','adobe'),
	create('Adobe AEM','adobe aem,adobe-aem,adobeaem'),
	create('Adobe Illustrator','adobe illustrator'),
	create('Advanced Business Application Programming (ABAP)','abap,advanced business application programming'),
	create('Agile','agile,scrum,sprint'),
	create('AirFlow','airflow'),
	create('Ajax','ajax'),
	create('Amazon','amazon'),
	create('Android','android'),
	create('Android Auto','android auto'),
	create('Android Studio','android studio'),
	create('Android TV','android tv'),
	create('Android X','android x'),
	create('Angular','angular,angular-js,angularjs'),
	create('Ansible','ansible'),
	create('AnyPoint','anypoint'),
	create('Apache','apache'),
	create('Apache Ignite','apache ignite,apache-ignite,apacheignite'),
	create('Apex','apex'),
	create('App Store','app store,apple app store'),
	create('Appium','appium'),
	create('Archer','archer'),
	create('Asana','asana'),
	create('Assembly','assembly'),
	create('Astro','astro'),
	create('Atlassian Confluence','atlassian confluence,confluence'),
	create('Audio','audio,sfx,sound'),
	create('Aura','aura'),
	create('AutoCAD','auto cad,auto-cad,autocad'),
	create('Autodesk','auto desk,auto-desk,autodesk'),
	create('Azure','azure'),
	create('Azure AD B2C','azure ad b2c,azure ad-b2c,azure adb2c'),
	create('Azure Blob Storage','azure blob storage,blob storage,blob-storage,blobstorage'),
	create('Azure Boards','azure boards,azure-boards,azureboards'),
	create('Azure Data Factory','azure data factory,data factory'),
	create('Azure Databricks','azure databricks,data bricks,data-bricks,databricks'),
	create('Azure IDP','azure idp'),
	create('Azure Managed Application Services','azure managed application services'),
	create('Azure SQL Server','azure sql,azure-sql,azuresql'),
	create('Azure Synapse Analytics','azure synapse,azure-synapse,azuresynapse'),
	create('BEM','bem'),
	create('BI Publisher','bi publisher,bi-publisher,bipublisher'),
	create('Babel','babel'),
	create('BadgerDB','badgerdb'),
	create('Bash','bash'),
	create('Batch','batch'),
	create('Behat','behat'),
	create('BigQuery','bigquery'),
	create('Birst','birst'),
	create('Bitbucket','bitbucket'),
	create('Blockchain','blockchain'),
	create('Bluetooth/BLE','ble,bluetooth'),
	create('Bootstrap','bootstrap'),
	create('Brightscript','brightscript,brightscripts'),
	create('C','c'),
	create('CI/CD','ci cd,ci-cd,ci/cd,cicd,continous delivery,continous integration,continuous deliveries,continuous delivery,continuous integration,continuous integrations,continuous-delivery,continuous-integration,continuousdelivery,continuousintegration'),
	create('CRM','crm,customer relations management,customer relationship management,customer relationships management'),
	create('CSS','css,css3'),
	create('CSS3','css3'),
	create('CVI','cvi'),
	create('CaaS','caas'),
	create('Canva','canva'),
	create('Capacitor','capacitor'),
	create('CarPlay','carplay'),
	create('Cassandra','cassandra'),
	create('Celery','celery'),
	create('Cerner Command Language','ccl,cerner ccl,cerner command language,cerner-ccl,cernerccl'),
	create('Cerner Millennium','cerner millennium,cerner-millennium,cernermillennium'),
	create('Chai','chai'),
	create('ChatGPT','chat gpt,chat-gpt,chatgpt'),
	create('CircleCI','circle ci,circle-ci,circleci'),
	create('Civil 3D','civil 3d,civil-3d,civil3d'),
	create('ClearCase','clearcase'),
	create('ClearQuest','clearquest'),
	create('Cloud','cloud'),
	create('CloudFront','cloud front,cloud-front,cloudfront'),
	create('Cloudwatch','cloudwatch'),
	create('Code Coverage','code coverage'),
	create('Codecommit','codecommit'),
	create('Compose','compose'),
	create('Computer Vision','computer vision,computer-vision,computervision,open cv,open-cv,opencv'),
	create('Computer-aided design (CAD)','cad,computer-aided design'),
	create('Configuration Management','configuration management'),
	create('Containerization','container,containerization,containerized,containers'),
	create('Context API','context api'),
	create('Coroutines','coroutine,coroutines'),
	create('Cosmos DB','cosmos db,cosmos-db,cosmosdb'),
	create('CouchDB','couch db,couch-db,couchdb'),
	create('Cucumber','cucumber'),
	create('Cypress','cypress'),
	create('DASH','dash'),
	create('DB2','db 2,db-2,db2'),
	create('DOM','dom'),
	create('DRY','dry'),
	create('Dart','dart'),
	create('Data Analysis','data analysis,data analysis software,data analytics'),
	create('Data Integration','data integration'),
	create('Data Lifecycle Management','data life,data lifecycle'),
	create('Data Management','data management'),
	create('Data Pipelines','data pipe line,data pipe lines,data pipe-line,data pipe-lines,data pipeline,data pipelines'),
	create('Data Science','data science,data sciences,data scientist,data scientists,data-science,data-sciences,data-scientist,data-scientists'),
	create('Data Storage','data storage,data store,data stores,datastore,datastores'),
	create('Data Structures','data structures,datastructures'),
	create('Data Warehousing','data warehousing'),
	create('DataViews','data views,data-views,dataviews'),
	create('Database Management Systems (DBMS)','data base,data bases,database,database management systems,databases,dbms'),
	create('Dataloader','dataloader'),
	create('Dataverse','data verse,data-verse,dataverse'),
	create('Debugging','debug,debugger,debuggers,debugging'),
	create('Deep Learning','deep learning,deep-learning,deeplearning'),
	create('Delphi','delphi'),
	create('Design Patterns','design patterns'),
	create('Desktop Applications','desktop applications'),
	create('DevExpress','devexpress'),
	create('DevOps','dev ops,dev-ops,devops'),
	create('Django','django,django rest,drf'),
	create('Django Rest Framework','django rest,django rest framework,drf'),
	create('Docker','docker'),
	create('Docusign','docusign'),
	create('Dojo','dojo'),
	create('Dynamics 365','dynamics 365,dynamics-365,dynamics365'),
	create('DynamoDB','dynamo,dynamodb'),
	create('Dynatrace','dyna trace,dyna-trace,dynatrace'),
	create('EC-Council','ec council,ec-council,eccouncil'),
	create('EC2','ec 2,ec-2,ec2'),
	create('ECMAScript','ecmascript'),
	create('EKS','eks'),
	create('ELT','elt'),
	create('ERP','erp'),
	create('ETL','etl'),
	create('Eclipse','eclipse'),
	create('Elastic Search','elastic search,elasticsearch'),
	create('Enterprise Application Integration','eai,enterprise application integration'),
	create('Enterprise Data Lake','enterprise data lake'),
	create('Entity Framework','entity framework'),
	create('Erlang','erlang'),
	create('Espresso','espresso'),
	create('Experience Cloud','experience cloud'),
	create('Express','express'),
	create('ExtJS','extjs'),
	create('FTP','ftp,ftps,sftp'),
	create('Facebook','facebook'),
	create('FastAPI','fastapi'),
	create('Fiddler','fiddler'),
	create('Filestore','filestore'),
	create('Firebase','fire base,fire-base,firebase'),
	create('Firestore','firestore'),
	create('Firewall','firewall,firewalls'),
	create('Flask','flask'),
	create('Flow Builder','flow builder,flowbuilder'),
	create('Flutter','flutter'),
	create('FormStack','formstack'),
	create('Foxpro','foxpro'),
	create('FreeRTOS','freertos'),
	create('GCC','gcc'),
	create('GCDocs','gcdocs'),
	create('GLUE','glue'),
	create('GOSU','gosu'),
	create('GPT','gpt'),
	create('GenAI','gen ai,gen-ai,genai'),
	create('Geospatial Systems Technology','geospatial systems,geospatial systems technology'),
	create('Gherkin','gherkin'),
	create('Git','git'),
	create('GitHub','github'),
	create('GitHub Actions','github action,github actions,github-action,github-actions,githubaction,githubactions'),
	create('GitOps','gitops'),
	create('Go','go'),
	create('Google Analytics','google analytics,google-analytics,googleanalytics'),
	create('Google Cloud','google cloud'),
	create('Google Cloud Platform (GCP)','gcp,google cloud platform'),
	create('Google Gemini','gemini,google gemini,google-gemini,googlegemini'),
	create('Google Kubernetes Engine (GKE)','gke,google kubernetes engine'),
	create('Google Play Store','google play,google play store,play store'),
	create('Gradle','gradle'),
	create('Grafana','grafana,graphana'),
	create('GraphQL','graphql'),
	create('Graphics','graphics'),
	create('GreenHills','greenhills'),
	create('Gupta','gupta'),
	create('HLS','hls'),
	create('HTML','html,html5'),
	create('HTML5','html5'),
	create('Hadoop','hadoop'),
	create('Hibernate','hibernate,hibernate 4,hibernate-4,hibernate4'),
	create('Hibernate4','hibernate 4,hibernate-4,hibernate4'),
	create('HyperV','hyper v,hyper-v,hyperv'),
	create('IOT','iot'),
	create('IaaS','iaas'),
	create('IndexedDB','indexed db,indexed-db,indexeddb'),
	create('Infor','infor'),
	create('Informatica','informatica'),
	create('Informix 4GL','informix 4gl'),
	create('IntelliJ','intellij'),
	create('Ionic','ionic'),
	create('J2EE','j2 ee,j2-ee,j2ee,java ee,java-ee,javaee'),
	create('JAX-RS','jax rs,jax-rs,jaxrs'),
	create('JEE','jee'),
	create('JIRA','jira'),
	create('JMC','jmc'),
	create('JMS','jms'),
	create('JPA','jpa'),
	create('JSON','java script object notation,javascript object notation,json'),
	create('JSP','jsp'),
	create('JTAG','jtag'),
	create('JUnit','junit'),
	create('JVM','jvm'),
	create('JWT','json web token,jwt'),
	create('Java','java'),
	create('Javascript','java script,java scripts,java-script,java-scripts,javascript,javascripts'),
	create('Jconsole','j console,j-console,jconsole'),
	create('Jelly','jelly'),
	create('Jenkins','jenkins'),
	create('Jetpack','jetpack'),
	create('Jetson','jetson'),
	create('K8s','k8,k8s'),
	create('KANBAN','kanban'),
	create('KPI','kpi,kpis'),
	create('KVM','kvm'),
	create('Kafka','kafka'),
	create('Katalon','katalon'),
	create('Keras','keras'),
	create('Kibana','kibana'),
	create('Kinesis','kinesis'),
	create('Kotlin','kotlin'),
	create('Kotlin Flow','kotlin flow'),
	create('Kubernetes','kubernetes'),
	create('LAMP','lamp'),
	create('LWC','lwc'),
	create('LWR','lwr'),
	create('Lab View','lab view,lab-view,labview'),
	create('Lambda','lambda'),
	create('LangChain','langchain'),
	create('Laravel','laravel'),
	create('Large Language Models (LLMs)','large language model,large language models,llm,llm ops,llm-ops,llmops,llms'),
	create('LiDAR','lidar,lidars'),
	create('Licensing and Control System (LCS)','lcs,licensing and control system,licensing and control systems'),
	create('Lightning','lightning'),
	create('Lightning Design System','lightning design,lightning design system'),
	create('Lightning Web Components','lightning web component,lightning web components'),
	create('Linux','linux'),
	create('Load Balancers','load balancers'),
	create('Logic Apps','logic apps,logic-apps,logicapps'),
	create('Lora','lora'),
	create('Lucene','lucene'),
	create('MACH digital architecture','mach,mach digital architecture'),
	create('MATLAB','matlab'),
	create('MCU','mcu'),
	create('MFC','mfc'),
	create('MS Active Directory','microsoft active directory,microsoft active-directory,microsoft ad,microsoft-ad,ms active directory,ms ad,ms-ad,msad'),
	create('MS IIS','iis web,iis webserver,iis-server,iis-web,iis-webserver,iiswebserver,microsoft iis,microsoft-iis,microsoftiis,ms iis,ms-iis,msiis'),
	create('MSSQL','microsoft sql,ms sql,mssql'),
	create('MVC','mvc'),
	create('MVC4','mvc 4,mvc-4,mvc4'),
	create('MVI','mvi'),
	create('MVVM','mvvm'),
	create('Mac OSX','mac,mac os,mac osx,macintosh,macos,macosx'),
	create('Machine Learning','machine learning,ml,mlops'),
	create('Mail Chimp','mail chimp,mailchimp'),
	create('Maven','maven'),
	create('Memcached','memcached'),
	create('Message Queue','message queue,message queues,mq,rabbitmq'),
	create('Meteor','meteor'),
	create('Microfocus','micro focus,micro-focus,microfocus'),
	create('Microfocus ALM','microfocus alm'),
	create('Microfocus Load Runner','microfocus load runner,microfocus load-runner,microfocus loadrunner'),
	create('Microfocus Octante','microfocus octante'),
	create('Microservices','micro services,micro-services,microservices'),
	create('Microsoft Access','access,microsoft access,ms access,msaccess'),
	create('Microsoft Excel','microsoft excel,ms excel,msexcel'),
	create('Microsoft Fabric','fabric,microsoft fabric,ms fabric,msfabric'),
	create('Microsoft Office','microsoft office,ms office,msoffice'),
	create('Microsoft Office 365','o365,office 365'),
	create('Microsoft Outlook','microsoft outlook,ms outlook,msoutlook,outlook'),
	create('Microsoft Powerpoint','microsoft powerpoint,ms powerpoint,mspowerpoint,power point,powerpoint'),
	create('Microsoft Project','microsoft project,ms project,msproject'),
	create('Microsoft Word','microsoft word,ms word,msword'),
	create('Mobile','mobile'),
	create('Mocha','mocha'),
	create('Mockito','mockito'),
	create('Moleculer','moleculer'),
	create('MongoDB','mongo,mongo db,mongo-db,mongodb'),
	create('MuleSoft','mulesoft'),
	create('Multi-threading','async,asynchronous,concurrency,concurrent,multi thread,multi threaded,multi threading,multi threads,multi-thread,multi-threaded,multi-threading,multi-threads,multithread,multithreaded,multithreading,multithreads,parallel computing,parallel processing,parallelization,re-entrancy,re-entrant,reentrancy,reentrant,synchronization,threading,threads'),
	create('Multimedia','multi media,multi-media,multimedia'),
	create('MySQL','mysql'),
	create('NATS','nats'),
	create('NLP','natural language processing,natural language processor,natural-language-processing,natural-language-processor,nlp'),
	create('NPM','npm'),
	create('NestJS','nestjs'),
	create('Netconf','netconf'),
	create('Networks','network,networking,networks,protocol,protocols'),
	create('NextJS','next js,next-js,nextjs'),
	create('Nexus','nexus'),
	create('Nifi','nifi'),
	create('Nightwatch','night watch,night-watch,nightwatch'),
	create('NoSQL','nosql'),
	create('Node.js','node,node js,node-js,nodejs'),
	create('Nordic','nordic'),
	create('OAuth','oauth,oauth-2,oauth2'),
	create('OCR','ocr,optical character recognition'),
	create('OData Standard','odata standard,odata standards'),
	create('OPA','opa'),
	create('ORM','object database,object relation,object relational,object relations,object relationships,orm,relational object'),
	create('OSS','oss'),
	create('OTA','ota'),
	create('Object-oriented Programming (OOP)','object oriented,object-oriented,object-oriented programming,oo,oop'),
	create('Objective C','objective c'),
	create('Okta','okta'),
	create('Open API','open api,open apis,open-api,open-apis,openapi,openapis'),
	create('Open Search','open search,opensearch'),
	create('Open Source','open source,open-source'),
	create('OpenAI','open ai,open ais,open-ai,open-ais,openai,openais'),
	create('OpenCL','opencl'),
	create('OpenCV','opencv'),
	create('OpenGL','opengl'),
	create('OpenID Connect','openid connect'),
	create('OpenShift','openshift'),
	create('OpenTelemetry','open telemetry,open-telemetry,opentelemetry'),
	create('Operating Systems','operating system,operating systems,os'),
	create('Oracle','oracle'),
	create('Oracle Application Frame','oaf,oracle application frame,oracle application frames'),
	create('Oracle Business Intelligence Enterprise Edition','obiee,oracle business intelligence enterprise edition'),
	create('Oracle EBS','oracle ebs,oracle-ebs'),
	create('Oracle Financials','oracle financials'),
	create('Oracle Forms','oracle forms'),
	create('Oracle Payments','oracle payment,oracle payments,oracle-payment,oracle-payments,oraclepayment,oraclepayments'),
	create('Oracle Reports','oracle report,oracle reports,oracle-report,oracle-reports,oraclereport,oraclereports'),
	create('Oracle eBusiness Suite','oracle ebusiness suite'),
	create('Orchestration','orchestrate,orchestration,orchestrator'),
	create('Orin','orin'),
	create('PCIe','pcie'),
	create('PHP','php'),
	create('PHPUnit','php unit,php-unit,phpunit'),
	create('PL/SQL','pl sql,pl-sql,pl/sql,plsql'),
	create('PaaS','paas'),
	create('Parquet','parquet'),
	create('Perforce','perforce'),
	create('Perl','perl'),
	create('Playwright','playwright'),
	create('Polarion','polarion'),
	create('PostgreSQL','postgres,postgresql'),
	create('Postman','postman'),
	create('Power Automate','power automate,power automates,power-automate,power-automates,powerautomate,powerautomates'),
	create('PowerApps','power apps,power-apps,powerapps'),
	create('PowerBI','power bi,power-bi,powerbi'),
	create('PowerBuilder','powerbuilder'),
	create('Powershell','power shell,power shells,power-shell,power-shells,powershell,powershells'),
	create('Progressive Web Apps (PWA)','progressive web app,progressive web apps,progressive web-app,progressive web-apps,progressive webapp,progressive webapps,pwa'),
	create('Project Management','project management'),
	create('ProjectWise','project wise,project-wise,projectwise'),
	create('Prometheus','prometheus'),
	create('Pub/Sub','pub/sub'),
	create('PySpark','pyspark'),
	create('PyTorch','pytorch'),
	create('Pyramid','pyramid'),
	create('Python','python'),
	create('QNX','qnx'),
	create('QT','qt'),
	create('Qlik','qlik'),
	create('RBMS','rbms'),
	create('REST','rest,rest-api,rest-apis,restapi,restapis,restful'),
	create('RTOS','freertos,rtos,zephyr'),
	create('RTP','rtp'),
	create('RabbitMQ','rabbitmq'),
	create('Rackspace','rackspace'),
	create('Rapid Application Development','rad,rapid application development'),
	create('React','react,react js,react-js,reactjs'),
	create('ReadyAPI','ready api,ready-api,readyapi'),
	create('Redis','redis'),
	create('Redux','redux'),
	create('Retrofit','retrofit'),
	create('Ross Web Platform (RWP)','ross web platform,rwp'),
	create('Ruby','ruby,ruby on rails'),
	create('Ruby on Rails','ruby on rails'),
	create('RxJs','rx js,rxjs'),
	create('S3','amazon simple storage service,s3'),
	create('SAP','sap'),
	create('SAS','sas'),
	create('SASS','sass'),
	create('SCSS','scss'),
	create('SFTP','sftp'),
	create('SIEM','siem'),
	create('SNMP','snmp'),
	create('SNS','sns'),
	create('SOAP','soap'),
	create('SPC','spc'),
	create('SQL','sql'),
	create('SQL Server Integration Services','sql server integration services,ssis'),
	create('SQLAlchemy','sql alchemy,sql-alchemy,sqlalchemy'),
	create('SQLite','lite sql,lite-sql,sql lite,sql lite3,sql-lite,sql-lite3,sqlite,sqlite3'),
	create('SQS','sqs'),
	create('SSH','ssh'),
	create('SVN','svn'),
	create('SaaS','saas,software as a service'),
	create('Sailpoint','sail point,sail-point,sailpoint'),
	create('Salesforce','salesforce'),
	create('Scala','scala'),
	create('ScalaTest','scala test,scala-test,scalatest'),
	create('Scripting','script,scripting,scripts'),
	create('Selenium','selenium'),
	create('Serverless','server less,server-less,serverless'),
	create('SharePoint','sharepoint'),
	create('Siebel','siebel'),
	create('Siebel Approval Manager','siebel approval manager,siebel approval-manager,siebel approvalmanager'),
	create('Siebel EIM','siebel eim,siebel-eim,siebeleim'),
	create('Siebel IP18','siebel ip18,siebel-ip18,siebelip18'),
	create('Siebel Open UI','siebel open ui,siebel open-ui,siebel openui'),
	create('Single Page Applications (SPA)','single page application,single page applications,spa'),
	create('Site Reliability Engineering (SRE)','site reliability engineering,sre'),
	create('Skaffold','skaffold'),
	create('Slack','slack'),
	create('Software Development Lifecycle (SDLC)','life cycle software,life cycle software development,life-cycle software,life-cycle software development,lifecycle software,lifecycle software development,sdlc,software development life cycle,software development life-cycle,software development lifecycle,software life cycle,software life-cycle,software lifecycle'),
	create('Solace','solace'),
	create('Solidity','solidity'),
	create('Solution Design Document','sdd,solution design document,solution design documents'),
	create('Spark','spark'),
	create('Spinnaker','spinnaker'),
	create('Spring','spring,springboot'),
	create('Svelte','svelte'),
	create('Swagger','swagger'),
	create('Swarm','swarm'),
	create('Swift','swift'),
	create('Syteline','syteline'),
	create('T-SQL','t sql,t-sql,t/sql,tsql'),
	create('TCP/IP','tcp,tcp ip,tcp-ip,tcp/ip,tcpip'),
	create('TDD','tdd,test driven,test-driven'),
	create('TERADATA','teradata'),
	create('TFS','tfs'),
	create('TM Forum','tm forum'),
	create('TSO','tso'),
	create('Tableau','tableau'),
	create('Talend','talend'),
	create('Teamcity','teamcity'),
	create('TensorFlow','tensorflow'),
	create('Terraform','terraform'),
	create('TestNG','testng'),
	create('TestStand','test stand,test-stand,teststand'),
	create('Testing','test,tester,testing,tests'),
	create('Typescript','typescript,typescripts'),
	create('UDP','udp,udp ip,udp-ip,udp/ip,udpip'),
	create('UI','ui,uis,user interface,user interfaces'),
	create('UML','uml'),
	create('UX','user experience,user experiences,user-experience,user-experiences,userexperience,userexperiences,ux'),
	create('Unified Functional Testing','uft,unified functional testing'),
	create('Unit Testing','unit test,unit tester,unit testing,unit tests,unit-test,unit-tester,unit-testing,unit-tests,unittest,unittester,unittesting,unittests'),
	create('Unix','unix'),
	create('VMWare','vmware'),
	create('VXworks','vxworks'),
	create('Vbscript','vb script,vb-script,vbscript'),
	create('Visio','visio'),
	create('Visual Basic','vb,vb script,vb-script,vba,vbscript,visual basic'),
	create('Visual Fox Pro','visual fox pro,visual fox-pro,visual foxpro'),
	create('Visual Studio','visual studio,visual studio code,vs code,vscode'),
	create('Visualforce','visualforce'),
	create('Vue.js','vue,vue js,vue-js,vuejs'),
	create('Vuetify','vuetify'),
	create('W3C','w3c'),
	create('WAI-ARIA','aria,wai aria,wai-aria,waiaria'),
	create('WAVE','wave'),
	create('WCAG','wcag,web content accessibility,web content accessibility guidelines'),
	create('WebRTC','webrtc'),
	create('Webpack','webpack'),
	create('Websocket','websocket'),
	create('WiFi','wi-fi,wifi,wireless'),
	create('Win32','win32'),
	create('Windows','windows'),
	create('Windows Presentation Foundation','windows presentation foundation,wpf'),
	create('Windows Server','windows server'),
	create('WordPress','wordpress'),
	create('Workbench','workbench'),
	create('XCode','xcode'),
	create('XML','dtd,xml,xsd,xsl'),
	create('XPath','xpath'),
	create('XRM Toolbox','xrm tool box,xrm tool-box,xrm toolbox'),
	create('XSLT','xslt'),
	create('Xamarin','xamarin'),
	create('Xavier','xavier'),
	create('Xilinx DSPs','xilinx dsp,xilinx dsps,xilinx-dsp,xilinx-dsps,xilinxdsp,xilinxdsps'),
	create('YAML','yaml'),
	create('YANG','yang'),
	create('Yocto','yocto'),
	create('Zephyr','zephyr'),
	create('Zigbee','zigbee'),
	create('ag-Grid','ag-grid'),
	create('amCharts','amcharts'),
	create('conan','conan'),
	create('gRPC','grpc'),
	create('iOS','ios'),
	create('jQuery','jquery'),
	create('jvisualvm','j visual vm,j visual-vm,j visualvm,j-visualvm,jvisualvm'),
	create('myt','myt'),
	create('scikit-learn','scikit-learn'),
]
