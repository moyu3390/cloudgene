package cloudgene.mapred.resources.admin;

import java.util.List;

import net.sf.json.JSONArray;

import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;
import org.restlet.resource.ServerResource;

import cloudgene.mapred.core.User;
import cloudgene.mapred.core.UserSessions;
import cloudgene.mapred.database.TemplateDao;
import cloudgene.mapred.util.Template;

public class GetTemplates extends ServerResource {

	@Get
	public Representation get() {

		UserSessions sessions = UserSessions.getInstance();
		User user = sessions.getUserByRequest(getRequest());

		if (user != null) {

			if (!user.isAdmin()) {
				setStatus(Status.CLIENT_ERROR_UNAUTHORIZED);
				return new StringRepresentation(
						"The request requires administration rights.");
			}

			TemplateDao dao = new TemplateDao();
			List<Template> templates = dao.findAll();

			JSONArray jsonArray = JSONArray.fromObject(templates);

			return new StringRepresentation(jsonArray.toString());

		} else {

			setStatus(Status.CLIENT_ERROR_UNAUTHORIZED);
			return new StringRepresentation(
					"The request requires user authentication.");

		}
	}

}